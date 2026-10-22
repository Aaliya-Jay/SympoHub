import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function readUserFromToken(token) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload?.id) return null;
  return User.findById(payload.id).select('-password');
}

export async function protect(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const user = await readUserFromToken(token);
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again.' });
    }
    next(error);
  }
}

// Used by the public discovery endpoint to show the current user's RSVP state without requiring login.
export async function optionalAuth(req, _res, next) {
  try {
    const token = getBearerToken(req);
    if (token) {
      try { req.user = await readUserFromToken(token); } catch { /* Public feed remains available for stale tokens. */ }
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  next();
}

export function studentOnly(req, res, next) {
  if (req.user?.role !== 'student') return res.status(403).json({ message: 'A student account is required for this action.' });
  next();
}
