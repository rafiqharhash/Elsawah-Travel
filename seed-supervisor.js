/**
 * Seed script: Creates the Rafiq Supervisor account.
 * Run once with: node seed-supervisor.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'Student' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const username = 'rafiq';
  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`✅ Supervisor "rafiq" already exists.`);
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash('password', 10);
  await User.create({
    name: 'Rafiq',
    username: 'rafiq',
    phone: '+9990000001',
    password,
    role: 'Supervisor',
    isActive: true,
  });

  console.log('');
  console.log('✅ Supervisor account created!');
  console.log('   Username: rafiq');
  console.log('   Password: password');
  console.log('   Role:     Supervisor');
  console.log('');
  console.log('👉 Login at: http://localhost:3000/admin/login');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
