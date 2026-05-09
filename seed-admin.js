/**
 * Seed script: Creates an Admin user in MongoDB.
 * Run once with: node server/seed-admin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'Student' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const phone = '+1000000000';
  const existing = await User.findOne({ phone });
  if (existing) {
    console.log(`✅ Admin user already exists (phone: ${phone})`);
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash('admin123', 10);
  await User.create({ name: 'Admin User', phone, password, role: 'Admin' });

  console.log('');
  console.log('✅ Admin user created successfully!');
  console.log('   Phone:    +1000000000');
  console.log('   Password: admin123');
  console.log('   Role:     Admin');
  console.log('');
  console.log('👉 Login at: http://localhost:3000/admin/login');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
