const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Seed script: Wipes entire database and creates the Rafiq Production Supervisor account.
 * To run: node seed-production.js
 */

// Replace with your MongoDB connection string if different
// or ensure this connects to your replica set
const uri = "mongodb://rafiqharhash_db_user:myclusterpassword@ac-yecreeq-shard-00-00.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-01.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-02.asqlj5y.mongodb.net:27017/uniride?ssl=true&replicaSet=atlas-8r12j2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function seed() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    console.log('⚠️ Wiping existing data...');
    // Drop collections to fully wipe the DB
    try { await mongoose.connection.collection('users').drop(); } catch (e) { /* ignore if doesn't exist */ }
    try { await mongoose.connection.collection('bookings').drop(); } catch (e) { }
    try { await mongoose.connection.collection('trips').drop(); } catch (e) { }
    try { await mongoose.connection.collection('vehicles').drop(); } catch (e) { }
    try { await mongoose.connection.collection('adminlogs').drop(); } catch (e) { }
    console.log('✅ Database wiped clean.');

    // Create Supervisor
    const username = 'berlin';
    const password = 'rafiqistherealberlin';

    console.log(`⏳ Creating Supervisor account "${username}"...`);

    // We can't use the model here directly since this is a plain js script and we're not compiling the TS models.
    // We'll write directly to the DB or use a generic mongoose model.
    const userSchema = new mongoose.Schema({
      name: String,
      username: String,
      phone: String,
      password: { type: String, select: false },
      role: String,
      isActive: Boolean,
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: 'Rafiq',
      username: username,
      phone: '+10000000000', // Admin must have a phone number in schema
      password: hashedPassword,
      role: 'Supervisor',
      isActive: true,
    });

    console.log(`✅ Production Supervisor "${username}" created successfully.`);
    console.log('-----------------------------------');
    console.log('   Role: Supervisor');
    console.log('   Name: Rafiq');
    console.log('   Username: berlin');
    console.log('   Password: rafiqistherealberlin');
    console.log('-----------------------------------');

  } catch (err) {
    console.error('❌ Error during database reset:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
