const mongoose = require('mongoose');

async function testBooking() {
  await mongoose.connect('mongodb://rafiqharhash_db_user:iambatman@ac-hq6lrxe-shard-00-00.ycvmc5a.mongodb.net:27017,ac-hq6lrxe-shard-00-01.ycvmc5a.mongodb.net:27017,ac-hq6lrxe-shard-00-02.ycvmc5a.mongodb.net:27017/?ssl=true&replicaSet=atlas-6epgvu-shard-0&authSource=admin&appName=Cluster0');

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
