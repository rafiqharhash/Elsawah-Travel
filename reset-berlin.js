const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This script will specifically reset the 'berlin' account password to ensure no double-hashing or mismatch.
const uri = "mongodb://rafiqharhash_db_user:iambatman@ac-hq6lrxe-shard-00-00.ycvmc5a.mongodb.net:27017,ac-hq6lrxe-shard-00-01.ycvmc5a.mongodb.net:27017,ac-hq6lrxe-shard-00-02.ycvmc5a.mongodb.net:27017/?ssl=true&replicaSet=atlas-6epgvu-shard-0&authSource=admin&appName=Cluster0";

async function reset() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    const username = 'berlin';
    const password = 'iambatman';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Use a generic model to avoid hooks
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const result = await User.updateOne(
      { username: { $regex: /^berlin$/i } },
      {
        $set: {
          username: 'berlin',
          password: hashedPassword,
          isActive: true,
          role: 'Supervisor',
          phone: '01068590407' // Dummy phone to satisfy unique index
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('✅ Created new "Berlin" user.');
    } else {
      console.log('✅ Updated existing "Berlin" user password.');
    }

    console.log('-----------------------------------');
    console.log('   Username: Berlin');
    console.log('   Password: iambatman');
    console.log('-----------------------------------');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();
