import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { Trip } from '../models/Trip';
import { Vehicle } from '../models/Vehicle';
import { AppError } from '../middleware/errorHandler';
import exceljs from 'exceljs';
import { parse } from 'json2csv';
import PDFDocument from 'pdfkit';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: draw a horizontal rule
// ─────────────────────────────────────────────────────────────────────────────
function hRule(doc: PDFKit.PDFDocument, y: number, width: number, color = '#E2E8F0') {
  doc.save().strokeColor(color).lineWidth(0.5).moveTo(40, y).lineTo(40 + width, y).stroke().restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Export a trip as a PDF sheet (one page per vehicle)
// @route GET /api/v1/export/trip/:tripId/pdf
// @access Private (Admin / Supervisor)
// ─────────────────────────────────────────────────────────────────────────────
export const exportTripPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;

    // 1. Load the trip with its vehicles
    const trip = await Trip.findById(tripId).populate<{
      vehicleIds: Array<{
        _id: any;
        vehicleNumber: string;
        driverName: string;
        driverPhone: string;
        capacity: number;
      }>
    }>('vehicleIds', 'vehicleNumber driverName driverPhone capacity');

    if (!trip) return next(new AppError('Trip not found', 404));

    // 2. Load all confirmed (or pending) bookings for this trip
    const bookings = await Booking.find({ tripId })
      .sort({ vehicleId: 1, createdAt: 1 });

    // 3. Group bookings by vehicle
    const bookingsByVehicle = new Map<string, typeof bookings>();
    for (const b of bookings) {
      const key = b.vehicleId.toString();
      if (!bookingsByVehicle.has(key)) bookingsByVehicle.set(key, []);
      bookingsByVehicle.get(key)!.push(b);
    }

    // 4. Build PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      autoFirstPage: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="trip_${tripId}_sheet.pdf"`
    );
    doc.pipe(res);

    const PAGE_W = 595 - 80; // A4 width minus margins
    const tripDate = new Date(trip.date).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const vehicles = trip.vehicleIds && trip.vehicleIds.length > 0
      ? trip.vehicleIds
      : [];

    // If no vehicles assigned, make one page with just trip info
    const pageSources: Array<typeof vehicles[0] | null> =
      vehicles.length > 0 ? [...vehicles] : [null];

    const totalPages = pageSources.length;
    let pageIndex = 0;

    for (const vehicle of pageSources) {
      pageIndex++;
      doc.addPage();

      // ── Header band ──────────────────────────────────────────────────────
      doc.rect(40, 40, PAGE_W, 70).fill('#1E293B');

      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('ELSAWAH TRAVEL', 55, 52);

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#94A3B8')
        .text('Professional Transport Services', 55, 75);

      // Trip route right-aligned
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#60A5FA')
        .text(trip.route, 55, 52, { align: 'right', width: PAGE_W - 15 });

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#CBD5E1')
        .text(`${tripDate} · ${trip.departureTime}`, 55, 75, { align: 'right', width: PAGE_W - 15 });

      let y = 130;

      // ── Vehicle Info Card ────────────────────────────────────────────────
      if (vehicle) {
        doc.rect(40, y, PAGE_W, 60).fill('#F1F5F9');
        doc.rect(40, y, 4, 60).fill('#3B82F6');

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E293B')
          .text('VEHICLE', 55, y + 8);

        doc.font('Helvetica-Bold').fontSize(18).fillColor('#1D4ED8')
          .text(vehicle.vehicleNumber, 55, y + 22);

        // Driver block
        const driverX = 40 + PAGE_W / 2;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B')
          .text('DRIVER', driverX, y + 8);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1E293B')
          .text(vehicle.driverName, driverX, y + 22);
        doc.font('Helvetica').fontSize(10).fillColor('#3B82F6')
          .text(vehicle.driverPhone, driverX, y + 38);

        y += 75;
      } else {
        // No vehicle assigned
        doc.rect(40, y, PAGE_W, 40).fill('#FFF7ED');
        doc.rect(40, y, 4, 40).fill('#F97316');
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#9A3412')
          .text('⚠  No vehicles assigned to this trip yet.', 55, y + 13);
        y += 55;
      }

      // ── Trip meta strip ──────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(9).fillColor('#64748B');
      const vehicleBookings = vehicle
        ? (bookingsByVehicle.get(vehicle._id.toString()) || [])
        : bookings;
      const booked = vehicleBookings.length;
      const cap = vehicle ? vehicle.capacity : trip.totalCapacity;

      doc.text(`STATUS: ${trip.status.toUpperCase()}`, 40, y, { continued: true });
      doc.text(`   PASSENGERS: ${booked} / ${cap}`, { continued: true });
      doc.text(`   TRIP ID: ${tripId.toString().slice(-8).toUpperCase()}`);
      y += 14;

      hRule(doc, y, PAGE_W);
      y += 12;

      // ── Passengers Table ─────────────────────────────────────────────────
      const COL = {
        num: 40,
        name: 70,
        phone: 240,
        pickup: 360,
        dropoff: 470,
      };

      // Table header
      doc.rect(40, y, PAGE_W, 20).fill('#EFF6FF');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1D4ED8');
      doc.text('#', COL.num + 2, y + 6);
      doc.text('PASSENGER NAME', COL.name, y + 6);
      doc.text('PHONE', COL.phone, y + 6);
      doc.text('PICKUP', COL.pickup, y + 6);
      doc.text('DROPOFF', COL.dropoff, y + 6);
      y += 22;

      // Fill seats 1–capacity
      const CAPACITY = cap || 14;
      // Build a flat map: seatNumber → booking
      const seatMap = new Map<number, typeof vehicleBookings[0]>();
      for (const b of vehicleBookings) {
        for (const sn of b.seatNumbers) {
          seatMap.set(sn, b);
        }
      }

      for (let seat = 1; seat <= CAPACITY; seat++) {
        const booking = seatMap.get(seat);
        const isBooked = !!booking;
        const rowBg = seat % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        doc.rect(40, y, PAGE_W, 18).fill(rowBg);

        // Seat number badge
        if (isBooked) {
          doc.rect(COL.num, y + 2, 18, 14).fill('#3B82F6').roundedRect(COL.num, y + 2, 18, 14, 3).fill('#3B82F6');
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF').text(String(seat), COL.num + 4, y + 5);
        } else {
          doc.rect(COL.num, y + 2, 18, 14).stroke('#CBD5E1');
          doc.font('Helvetica').fontSize(8).fillColor('#94A3B8').text(String(seat), COL.num + 4, y + 5);
        }

        if (isBooked && booking) {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A')
            .text(booking.studentName, COL.name, y + 5, { width: 165, ellipsis: true });
          doc.font('Helvetica').fontSize(8).fillColor('#475569')
            .text(booking.studentPhone, COL.phone, y + 5, { width: 115 });
          doc.font('Helvetica').fontSize(8).fillColor('#0F172A')
            .text(booking.pickupLocation, COL.pickup, y + 5, { width: 105, ellipsis: true });
          doc.font('Helvetica').fontSize(8).fillColor('#64748B')
            .text(booking.dropoffLocation, COL.dropoff, y + 5, { width: 95, ellipsis: true });
        } else {
          doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
            .text('— Available —', COL.name, y + 5);
        }

        hRule(doc, y + 18, PAGE_W, '#E2E8F0');
        y += 19;
      }

      // ── Summary footer ───────────────────────────────────────────────────
      y += 10;
      doc.rect(40, y, PAGE_W, 28).fill('#1E293B');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#F1F5F9')
        .text(
          `Total Booked: ${booked}   ·   Available Seats: ${CAPACITY - booked}   ·   Capacity: ${CAPACITY}`,
          55, y + 9
        );
      doc.font('Helvetica').fontSize(8).fillColor('#64748B')
        .text(`Generated on ${new Date().toLocaleString()}`, 55, y + 9, { align: 'right', width: PAGE_W - 15 });

      // ── Page number ──────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
        .text(
          `Page ${pageIndex} of ${totalPages}`,
          0, doc.page.height - 30,
          { align: 'center', width: doc.page.width }
        );
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Export trip bookings as Excel or CSV
// @route GET /api/v1/export/trip/:tripId
// ─────────────────────────────────────────────────────────────────────────────
export const exportTripBookings = async (req: Request, res: Response, next: NextFunction) => {
  const { tripId } = req.params;
  const { format } = req.query;

  const trip = await Trip.findById(tripId);
  if (!trip) return next(new AppError('Trip not found', 404));

  const bookings = await Booking.find({ tripId }).populate('vehicleId', 'vehicleNumber driverName');

  const data = bookings.map((b) => ({
    ReferenceID: b.referenceId,
    StudentName: b.studentName,
    Phone: b.studentPhone,
    PickupAddress: b.pickupAddress || 'N/A',
    Pickup: b.pickupLocation,
    Dropoff: b.dropoffLocation,
    Vehicle: (b.vehicleId as any)?.vehicleNumber || 'N/A',
    SeatNumbers: b.seatNumbers.join(', '),
    SeatCount: b.seatCount,
    PricePerSeat: b.pricePerSeat,
    TotalAmount: b.amount,
    Status: b.status,
    BookedAt: b.createdAt.toISOString(),
  }));

  if (format === 'excel') {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));
      worksheet.addRows(data);
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=trip_${tripId}_bookings.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } else {
    const csv = data.length > 0 ? parse(data) : 'No bookings found';
    res.header('Content-Type', 'text/csv');
    res.attachment(`trip_${tripId}_bookings.csv`);
    return res.send(csv);
  }
};
