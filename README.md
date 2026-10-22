# SympoHub — Campus Event & Symposium Registration

A full-stack MERN application for discovering campus events, managing RSVPs with an ordered FIFO waitlist, issuing client-generated QR passes, and exporting confirmed attendee rosters.

## Stack

- **Client:** React 18, Vite, React Router, Tailwind CSS, Lucide React, Axios, `qrcode.react`
- **API:** Node.js 20+, Express 4, Mongoose 8, JWT, bcryptjs, Helmet, CORS, rate limiting, Nodemailer
- **Database:** MongoDB

## Project layout

```text
sympohub/
├── README.md
├── server/
│   ├── config/db.js
│   ├── controllers/{authController,eventController}.js
│   ├── middleware/{auth,errorHandler}.js
│   ├── models/{User,Event}.js
│   ├── routes/{authRoutes,eventRoutes}.js
│   ├── scripts/seed.js
│   ├── utils/email.js
│   ├── server.js
│   └── .env.example
└── client/
    ├── src/components/{Navbar,EventCard,EventFeed,MySchedule,AdminDashboard,AuthModal}.jsx
    ├── src/context/AuthContext.jsx
    ├── src/lib/{api,format}.js
    ├── src/{App.jsx,main.jsx,index.css}
    └── .env.example
```

## Run locally

Requirements: Node.js 20+ and MongoDB Community Server, MongoDB Atlas, or another reachable MongoDB deployment.

### 1. Configure the API

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set `MONGODB_URI`. Set `JWT_SECRET` to a long random secret (at least 32 characters). Keep `.env` private and never commit real secrets.

Install packages, seed local demo data, and start the API:

```bash
npm install
npm run seed
npm run dev
```

The API runs on `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 2. Configure and run the web client

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. `VITE_API_URL` defaults to `http://localhost:5000/api`.

### Demo accounts

The seed script creates these development accounts if they do not already exist:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@sympohub.edu` | `Admin@12345` |
| Student | `student@sympohub.edu` | `Student@12345` |

Override demo credentials via the `SEED_*` variables before running the seed command. Demo credentials are for local development only. Do not use them in a publicly accessible deployment. The seed script is idempotent by event title and will not reset existing user passwords.

## API contract

All API routes are prefixed by `/api`.

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public, rate-limited | Create a student account and return profile + JWT |
| `POST` | `/auth/login` | Public, rate-limited | Authenticate and return profile + JWT |
| `GET` | `/events` | Public (optional token) | List/filter events using `department`, `search`, and `timeline=upcoming\|past` |
| `POST` | `/events` | Admin | Publish an event |
| `GET` | `/events/my` | Student | Return confirmed and waitlisted registrations |
| `POST` | `/events/:id/rsvp` | Student | Reserve a seat or join the FIFO waitlist |
| `DELETE` | `/events/:id/rsvp` | Student | Cancel a spot / leave the waitlist, atomically promote the oldest waiter when appropriate |
| `GET` | `/events/:id/export` | Admin | Stream a CSV of confirmed attendees |
| `GET` | `/health` | Public | API health response at `/api/health` |

Authenticated requests use `Authorization: Bearer <token>`.

## RSVP and FIFO guarantees

RSVP confirmation uses a conditional MongoDB document update that checks seat capacity and appends the attendee in the same operation. Waitlist insertion is also conditional and guards against duplicate registrations. Cancellation uses an atomic MongoDB update pipeline to remove the departing user and move the first waitlisted ObjectId into the attendee array in the same document operation. Notifications are queued asynchronously, so an SMTP outage does not roll back a valid RSVP.

The event document is the unit of atomicity. This does not require a multi-document transaction for seat allocation or queue promotion. As with any email notification architecture, SMTP delivery itself is not exactly-once; production deployments that require durable delivery should replace the in-process queue with a persistent job/outbox system.

## Email setup

Email is optional for local UI/API development. To enable transactional messages, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `server/.env`. The API does not wait for SMTP to deliver RSVP and promotion notifications.

## Production deployment checklist

- Set a strong unique `JWT_SECRET`; keep database credentials and SMTP credentials in the deployment secret manager.
- Set `NODE_ENV=production`, `MONGODB_URI`, `CORS_ORIGIN` to the exact client origin(s), and `VITE_API_URL` to the deployed API URL before building the client.
- Replace the demo seed accounts/passwords; do not expose development credentials publicly.
- Serve the client and API over HTTPS. Review rate limits against expected traffic and add monitoring/log aggregation.
- JWTs are stored in LocalStorage here to match the requested client contract. That makes XSS prevention especially important: keep dependencies updated, avoid rendering untrusted HTML, and consider an HttpOnly, Secure, SameSite cookie strategy for deployments where the client/API architecture permits it.
- Configure MongoDB backups and alerting. For higher-assurance email delivery, use a durable queue/outbox; the current queued email helper is intentionally non-blocking but in-process.
- The QR code payload is a client-generated, structured admission identifier, not a cryptographic signature. For real door validation, have the server issue a signed/opaque ticket token and provide a check-in verification endpoint with replay prevention.

## Useful commands

```bash
# server/
npm run dev
npm start
npm run seed

# client/
npm run dev
npm run build
npm run preview
```
