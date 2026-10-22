import nodemailer from 'nodemailer';

let transporter;
let transporterChecked = false;

function getTransporter() {
  if (transporterChecked) return transporter;
  transporterChecked = true;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) return undefined;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASS || '' } } : {})
  });
  return transporter;
}

// Fire-and-forget notifications must never make an RSVP fail because SMTP is unavailable.
export function queueEmail({ to, subject, text }) {
  queueMicrotask(async () => {
    try {
      const mailer = getTransporter();
      if (!mailer) {
        if (process.env.NODE_ENV !== 'production') console.info('[email] SMTP not configured; skipped:', subject);
        return;
      }
      await mailer.sendMail({
        from: process.env.MAIL_FROM || 'SympoHub <no-reply@example.com>',
        to,
        subject,
        text
      });
    } catch (error) {
      console.error('[email] Delivery failed:', error.message);
    }
  });
}

export function queueRsvpEmail(user, event, status) {
  const confirmed = status === 'confirmed';
  queueEmail({
    to: user.email,
    subject: confirmed ? `You're registered: ${event.title}` : `You're on the waitlist: ${event.title}`,
    text: confirmed
      ? `Hi ${user.name},\n\nYour spot for ${event.title} is confirmed.\nVenue: ${event.venue}\nDate: ${new Date(event.date).toLocaleString('en-IN')}\n\nShow your SympoHub QR pass at check-in.`
      : `Hi ${user.name},\n\nYou have been added to the FIFO waitlist for ${event.title}. We will email you if a spot opens.\nVenue: ${event.venue}\nDate: ${new Date(event.date).toLocaleString('en-IN')}\n\n— SympoHub`
  });
}

export function queuePromotionEmail(user, event) {
  if (!user?.email) return;
  queueEmail({
    to: user.email,
    subject: `A spot opened up: ${event.title}`,
    text: `Hi ${user.name},\n\nGreat news! A spot has opened up and you have been promoted from the waitlist to a confirmed attendee for ${event.title}.\nVenue: ${event.venue}\nDate: ${new Date(event.date).toLocaleString('en-IN')}\n\nOpen SympoHub to view your admission QR pass.\n\n— SympoHub`
  });
}
