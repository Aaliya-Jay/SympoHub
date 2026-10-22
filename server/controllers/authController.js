import jwt from 'jsonwebtoken';
import User, { DEPARTMENTS } from '../models/User.js';

function createToken(userId) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'sympohub-api'
  });
}

function publicProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, department } = req.body || {};
    if (![name, email, password, department].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Name, email, password, and department are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    if (!DEPARTMENTS.includes(department)) return res.status(400).json({ message: 'Choose a valid department.' });

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' });

    // Public registration can only create student accounts. Admins are seeded or provisioned separately.
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, department, role: 'student' });
    return res.status(201).json({ user: publicProfile(user), token: createToken(user._id) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return res.json({ user: publicProfile(user), token: createToken(user._id) });
  } catch (error) {
    next(error);
  }
}
