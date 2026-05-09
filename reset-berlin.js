const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This script will specifically reset the 'berlin' account password to ensure no double-hashing or mismatch.
const uri = "mongodb://rafiqharhash_db_user:myclusterpassword@ac-yecreeq-shard-00-00.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-01.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-02.asqlj5y.mongodb.net:27017/uniride?ssl=true&replicaSet=atlas-8r12j2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function reset() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    const username = 'berlin';
    const password = 'rafiqistherealberlin';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Use a generic model to avoid hooks
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const result = await User.updateOne(
      { username: username },
      { 
        $set: { 
          password: hashedPassword,
          isActive: true,
          role: 'Supervisor'
        } 
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('✅ Created new "berlin" user.');
    } else {
      console.log('✅ Updated existing "berlin" user password.');
    }

    console.log('-----------------------------------');
    console.log('   Username: berlin');
    console.log('   Password: rafiqistherealberlin');
    console.log('-----------------------------------');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();
