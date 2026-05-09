const mongoose = require('mongoose');

async function testBooking() {
  await mongoose.connect('mongodb://rafiqharhash_db_user:myclusterpassword@ac-yecreeq-shard-00-00.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-01.asqlj5y.mongodb.net:27017,ac-yecreeq-shard-00-02.asqlj5y.mongodb.net:27017/uniride?ssl=true&replicaSet=atlas-8r12j2-shard-0&authSource=admin&retryWrites=true&w=majority');

  const { Trip } = require('./src/models/Trip');
  const { Vehicle } = require('./src/models/Vehicle');
  const { processBookingTransaction } = require('./src/services/bookingService');

  try {
    const v = new Vehicle({ vehicleNumber: 'TEST-' + Date.now(), driverName: 'Bob', driverPhone: '123', capacity: 14 });
    await v.save();

    const t = new Trip({
      route: 'Test Route',
      date: new Date(Date.now() + 86400000), // Tomorrow
      departureTime: '10:00',
      status: 'Scheduled',
      vehicleIds: [v._id],
      totalCapacity: 14,
      totalBooked: 0
    });
    await t.save();

    console.log('Created Trip:', t._id);

    const result = await processBookingTransaction({
      studentName: 'Test Student',
      studentPhone: '01000000000',
      pickupLocation: 'Kafr Eksheikh',
      dropoffLocation: 'Alexandria',
      tripId: t._id.toString(),
      paymentScreenshot: 'dummy.png',
      seatCount: 1
    });

    console.log('Booking Result:', result.booking._id);
  } catch (error) {
    console.error('Booking Error:', error);
  } finally {
    process.exit(0);
  }
}

testBooking();
