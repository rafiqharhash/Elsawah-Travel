import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { Trip } from '../models/Trip';
import { User } from '../models/User';
import { sendResponse } from '../utils/responseFormatter';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Basic Counts
    const totalUsers = await User.countDocuments({ role: 'Student' });
    const totalTrips = await Trip.countDocuments({ status: { $ne: 'Cancelled' } });
    const activeTripsCount = await Trip.countDocuments({ status: { $in: ['Scheduled', 'Active'] } });

    // 2. Weekly Activity (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format weekly stats for Recharts (fill in zeros for missing days)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = weeklyStats.find(s => s._id === dateStr);
      days.push({ name: dayName, bookings: found ? found.count : 0 });
    }

    // 3. Occupancy & Revenue
    const bookings = await Booking.find({ status: 'Confirmed' });
    const totalBookedSeats = bookings.reduce((sum, b) => sum + (b.seatCount || 1), 0);
    
    const trips = await Trip.find({ status: { $in: ['Active', 'Scheduled'] } });
    const totalCapacity = trips.reduce((sum, t) => sum + (t.totalCapacity || 0), 0);
    const avgOccupancy = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0;

    sendResponse(res, 200, true, 'Stats fetched successfully', {
      totalUsers,
      totalTrips,
      activeTripsCount,
      avgOccupancy,
      totalBookedSeats,
      weeklyActivity: days
    });
  } catch (err) {
    next(err);
  }
};
