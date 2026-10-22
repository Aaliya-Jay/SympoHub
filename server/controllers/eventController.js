import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { queuePromotionEmail, queueRsvpEmail } from '../utils/email.js';

const DEPARTMENTS = ['AI & DS', 'CSE', 'ECE', 'IT', 'Mech', 'All'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasId(list, id) {
  return (list || []).some(item => String(item?._id || item) === String(id));
}

function serializeEvent(event, userId = null) {
  const plain = event.toObject ? event.toObject() : { ...event };
  const attendees = plain.attendees || [];
  const waitlist = plain.waitlist || [];
  let registrationStatus = null;
  let waitlistPosition = null;
  if (userId && hasId(attendees, userId)) registrationStatus = 'confirmed';
  else if (userId && hasId(waitlist, userId)) {
    registrationStatus = 'waitlisted';
    waitlistPosition = waitlist.findIndex(item => String(item?._id || item) === String(userId)) + 1;
  }
  delete plain.attendees;
  delete plain.waitlist;
  delete plain.__v;
  return {
    ...plain,
    attendeeCount: attendees.length,
    waitlistCount: waitlist.length,
    registrationStatus,
    waitlistPosition
  };
}

function validEventId(id) {
  return mongoose.isValidObjectId(id);
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function filenameSlug(title) {
  return String(title || 'event-attendees')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/[ ]+/g, '-')
    .slice(0, 100) || 'event-attendees';
}

export async function listEvents(req, res, next) {
  try {
    const { department, search, timeline } = req.query;
    const filter = {};
    if (typeof department === 'string' && department !== 'All') {
      if (!DEPARTMENTS.includes(department) || department === 'All') {
        return res.status(400).json({ message: 'Choose a valid department filter.' });
      }
      filter.departments = { $in: [department, 'All'] };
    }
    if (typeof search === 'string' && search.trim()) {
      const expression = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
      filter.$or = [
        { title: expression },
        { organizerClub: expression },
        { description: expression }
      ];
    }
    const now = new Date();
    if (timeline === 'upcoming') filter.date = { $gte: now };
    else if (timeline === 'past') filter.date = { $lt: now };
    else if (timeline && !['upcoming', 'past'].includes(timeline)) {
      return res.status(400).json({ message: 'Timeline must be upcoming or past.' });
    }

    const events = await Event.find(filter)
      .sort({ date: 1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean({ virtuals: false });
    const currentUserId = req.user?._id || null;
    res.json(events.map(event => serializeEvent(event, currentUserId)));
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    const { title, description, category, organizerClub, venue, date, capacity, departments } = req.body || {};
    if (!Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({ message: 'Select at least one eligible department.' });
    }
    if (departments.some(item => !DEPARTMENTS.includes(item))) {
      return res.status(400).json({ message: 'One or more departments are invalid.' });
    }
    const normalizedDepartments = departments.includes('All') ? ['All'] : [...new Set(departments)];
    const parsedDate = new Date(date);
    if (!date || Number.isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Enter a valid event date and time.' });
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) return res.status(400).json({ message: 'Capacity must be a whole number greater than zero.' });

    const event = await Event.create({
      title, description, category, organizerClub, venue,
      date: parsedDate,
      capacity: Number(capacity),
      departments: normalizedDepartments,
      createdBy: req.user._id
    });
    await event.populate('createdBy', 'name email');
    res.status(201).json(serializeEvent(event, req.user._id));
  } catch (error) {
    next(error);
  }
}

export async function getMyEvents(req, res, next) {
  try {
    const userId = req.user._id;
    const events = await Event.find({ $or: [{ attendees: userId }, { waitlist: userId }] })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');
    res.json(events.map(event => serializeEvent(event, userId)));
  } catch (error) {
    next(error);
  }
}

export async function rsvp(req, res, next) {
  try {
    const { id } = req.params;
    if (!validEventId(id)) return res.status(400).json({ message: 'Invalid event ID.' });
    const userId = req.user._id;
    const common = { _id: id, attendees: { $ne: userId }, waitlist: { $ne: userId } };

    // The capacity predicate and append happen in one MongoDB document update. Retrying closes
    // the small race where a cancellation changes capacity between the two conditional updates.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const confirmed = await Event.findOneAndUpdate({
        ...common,
        $expr: { $lt: [{ $size: { $ifNull: ['$attendees', []] } }, '$capacity'] }
      }, [{ $set: { attendees: { $concatArrays: [{ $ifNull: ['$attendees', []] }, { $literal: [userId] }] } } }], { new: true });

      if (confirmed) {
        queueRsvpEmail(req.user, confirmed, 'confirmed');
        return res.status(200).json({
          message: 'Your spot is confirmed.',
          status: 'confirmed',
          event: serializeEvent(confirmed, userId)
        });
      }

      const waitlisted = await Event.findOneAndUpdate({
        ...common,
        $expr: { $gte: [{ $size: { $ifNull: ['$attendees', []] } }, '$capacity'] }
      }, [{ $set: { waitlist: { $concatArrays: [{ $ifNull: ['$waitlist', []] }, { $literal: [userId] }] } } }], { new: true });

      if (waitlisted) {
        queueRsvpEmail(req.user, waitlisted, 'waitlisted');
        return res.status(200).json({
          message: 'The event is full. You have joined the FIFO waitlist.',
          status: 'waitlisted',
          event: serializeEvent(waitlisted, userId)
        });
      }

      const current = await Event.findById(id).select('title attendees waitlist capacity');
      if (!current) return res.status(404).json({ message: 'Event not found.' });
      if (hasId(current.attendees, userId) || hasId(current.waitlist, userId)) {
        return res.status(400).json({ message: 'You have already registered for this event.' });
      }
    }
    return res.status(409).json({ message: 'The event changed while registering. Please try again.' });
  } catch (error) {
    next(error);
  }
}

export async function cancelRsvp(req, res, next) {
  try {
    const { id } = req.params;
    if (!validEventId(id)) return res.status(400).json({ message: 'Invalid event ID.' });
    const userId = req.user._id;

    // Pipeline update atomically removes the departing user and promotes the oldest waiter.
    // Returning the pre-update document lets us identify exactly who was promoted.
    const previous = await Event.findOneAndUpdate({
      _id: id,
      $or: [{ attendees: userId }, { waitlist: userId }]
    }, [{ $set: {
      attendees: {
        $let: {
          vars: {
            att: { $ifNull: ['$attendees', []] },
            wait: { $ifNull: ['$waitlist', []] },
            wasAttending: { $in: [userId, { $ifNull: ['$attendees', []] }] }
          },
          in: {
            $concatArrays: [
              { $filter: { input: '$$att', as: 'attendee', cond: { $ne: ['$$attendee', userId] } } },
              { $cond: [
                { $and: ['$$wasAttending', { $gt: [{ $size: '$$wait' }, 0] }] },
                { $slice: ['$$wait', 0, 1] },
                []
              ] }
            ]
          }
        }
      },
      waitlist: {
        $let: {
          vars: {
            att: { $ifNull: ['$attendees', []] },
            wait: { $ifNull: ['$waitlist', []] },
            wasAttending: { $in: [userId, { $ifNull: ['$attendees', []] }] }
          },
          in: {
            $cond: [
              { $and: ['$$wasAttending', { $gt: [{ $size: '$$wait' }, 0] }] },
              { $slice: ['$$wait', 1, { $size: '$$wait' }] },
              { $filter: { input: '$$wait', as: 'waiting', cond: { $ne: ['$$waiting', userId] } } }
            ]
          }
        }
      }
    } }], { new: false });

    if (!previous) {
      const exists = await Event.exists({ _id: id });
      return res.status(exists ? 400 : 404).json({ message: exists ? 'You are not registered for this event.' : 'Event not found.' });
    }

    const wasAttending = hasId(previous.attendees || [], userId);
    const promotedId = wasAttending && (previous.waitlist || []).length > 0 ? previous.waitlist[0] : null;
    if (promotedId) {
      const [promotedUser, updatedEvent] = await Promise.all([
        User.findById(promotedId).select('name email'),
        Event.findById(id).select('title venue date attendees waitlist capacity')
      ]);
      if (promotedUser && updatedEvent) queuePromotionEmail(promotedUser, updatedEvent);
    }

    return res.json({
      message: wasAttending
        ? (promotedId ? 'Your spot was cancelled and the first waitlisted student was promoted.' : 'Your spot was cancelled.')
        : 'You have been removed from the waitlist.',
      promoted: Boolean(promotedId)
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAttendees(req, res, next) {
  try {
    const { id } = req.params;
    if (!validEventId(id)) return res.status(400).json({ message: 'Invalid event ID.' });
    const event = await Event.findById(id).populate('attendees', 'name email department');
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const filename = `${filenameSlug(event.title)}-attendees.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    const source = Readable.from((async function* generateCsv() {
      yield ['Name', 'Email', 'Department', 'Event', 'Event Date'].map(csvCell).join(',') + '\r\n';
      for (const student of (event.attendees || [])) {
        yield [
          student?.name,
          student?.email,
          student?.department,
          event.title,
          new Date(event.date).toISOString()
        ].map(csvCell).join(',') + '\r\n';
      }
    })());
    source.on('error', error => res.destroy(error));
    source.pipe(res);
  } catch (error) {
    next(error);
  }
}
