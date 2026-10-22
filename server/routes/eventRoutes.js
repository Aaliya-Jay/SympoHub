import { Router } from 'express';
import { cancelRsvp, createEvent, exportAttendees, getMyEvents, listEvents, rsvp } from '../controllers/eventController.js';
import { adminOnly, optionalAuth, protect, studentOnly } from '../middleware/auth.js';

const router = Router();
router.get('/', optionalAuth, listEvents);
router.get('/my', protect, studentOnly, getMyEvents);
router.post('/', protect, adminOnly, createEvent);
router.get('/:id/export', protect, adminOnly, exportAttendees);
router.post('/:id/rsvp', protect, studentOnly, rsvp);
router.delete('/:id/rsvp', protect, studentOnly, cancelRsvp);
export default router;
