import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Event from '../models/Event.js';

const plusDays = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9 + (days % 7), 30, 0, 0);
  return date;
};

async function ensureUser({ name, email, password, department, role }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = await User.create({ name, email: email.toLowerCase(), password, department, role });
    console.log(`Seeded ${role}: ${email}`);
  } else {
    console.log(`Existing ${role}: ${email}`);
  }
  return user;
}

async function main() {
  await connectDB();
  const admin = await ensureUser({
    name: 'SympoHub Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@sympohub.edu',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    department: 'AI & DS',
    role: 'admin'
  });
  await ensureUser({
    name: 'Demo Student',
    email: process.env.SEED_STUDENT_EMAIL || 'student@sympohub.edu',
    password: process.env.SEED_STUDENT_PASSWORD || 'Student@12345',
    department: 'AI & DS',
    role: 'student'
  });

  const samples = [
    {
      title: 'Nexus 2026 · National Technical Symposium',
      description: 'A campus-wide symposium featuring paper presentations, rapid prototyping, technical quizzes, and conversations with emerging engineers.',
      category: 'Symposium', organizerClub: 'AI & DS Association', venue: 'Main Auditorium', date: plusDays(5), capacity: 180,
      departments: ['All']
    },
    {
      title: 'Prompt to Product: Generative AI Lab',
      description: 'A hands-on workshop on prototyping responsible AI applications, evaluating outputs, and taking an idea from prompt to a working demo.',
      category: 'Workshop', organizerClub: 'AI Innovation Club', venue: 'AI Lab · Block B', date: plusDays(8), capacity: 48,
      departments: ['AI & DS', 'CSE', 'IT']
    },
    {
      title: 'Build for Good · 24-Hour Hackathon',
      description: 'Team up to build practical solutions for accessibility, sustainability, and campus life. Bring a laptop, ideas, and a curious mind.',
      category: 'Hackathon', organizerClub: 'Developer Student Community', venue: 'Innovation Hub', date: plusDays(14), capacity: 100,
      departments: ['All']
    },
    {
      title: 'CircuitVerse: Embedded Systems Studio',
      description: 'Explore sensor interfaces, microcontrollers, and rapid hardware prototyping through guided challenges and a mini design showcase.',
      category: 'Workshop', organizerClub: 'ECE Tech Forum', venue: 'Embedded Systems Lab', date: plusDays(19), capacity: 36,
      departments: ['ECE', 'Mech', 'AI & DS']
    },
    {
      title: 'Data Stories · Student Research Colloquium',
      description: 'A student research meet for clear data storytelling, project demos, poster sessions, and peer feedback across disciplines.',
      category: 'Symposium', organizerClub: 'Research & Analytics Cell', venue: 'Seminar Hall 2', date: plusDays(25), capacity: 72,
      departments: ['AI & DS', 'CSE', 'IT']
    }
  ];

  for (const data of samples) {
    await Event.updateOne(
      { title: data.title },
      { $setOnInsert: { ...data, createdBy: admin._id } },
      { upsert: true }
    );
  }
  console.log(`Seed complete. Sample events checked: ${samples.length}.`);
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error('Seed failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
