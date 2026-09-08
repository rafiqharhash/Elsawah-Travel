"use strict";
/**
 * Migration: backfill multi-seat fields on legacy booking documents.
 *
 * Old documents have: { seatNumber: N, amount: N }
 * New schema expects: { seatNumbers: [N], seatCount: 1, pricePerSeat: N }
 *
 * Run once:  npx ts-node src/scripts/migrateSeatNumbers.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || '';
const PRICES = {
    'Kafr Eksheikh': 210,
    'Kaft Eksheikh': 210, // old typo variant
    'Desouk': 190,
    'Damanhour': 190,
    'Abu Hummus': 170,
    'Kafr Eldawwar': 170,
};
async function migrate() {
    if (!MONGO_URI) {
        console.error('❌  MONGO_URI not found in environment. Check your .env file.');
        process.exit(1);
    }
    await mongoose_1.default.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB');
    const col = mongoose_1.default.connection.collection('bookings');
    // Find all documents that are missing the new seatNumbers field
    const legacy = await col.find({
        $or: [
            { seatNumbers: { $exists: false } },
            { seatNumbers: { $size: 0 } },
        ],
    }).toArray();
    console.log(`📦  Found ${legacy.length} legacy booking(s) to migrate`);
    if (legacy.length === 0) {
        console.log('✨  Nothing to migrate — all documents already in new format.');
        await mongoose_1.default.disconnect();
        return;
    }
    let updated = 0;
    let skipped = 0;
    for (const doc of legacy) {
        const seatNum = doc.seatNumber;
        const amount = doc.amount ?? 0;
        const pickup = doc.pickupLocation ?? '';
        const pricePerSeat = PRICES[pickup] ?? amount; // fallback to total amount if unknown
        const seatCount = 1;
        const seatNumbers = seatNum !== undefined ? [seatNum] : [];
        if (seatNumbers.length === 0) {
            console.warn(`  ⚠  Skipping ${doc._id} — no seatNumber found`);
            skipped++;
            continue;
        }
        await col.updateOne({ _id: doc._id }, {
            $set: {
                seatNumbers,
                seatCount,
                pricePerSeat,
                // keep seatNumber so old references don't break
            },
        });
        updated++;
        console.log(`  ✔  Migrated booking ${doc.referenceId ?? doc._id} → seats [${seatNumbers}]`);
    }
    console.log(`\n🎉  Done — ${updated} updated, ${skipped} skipped`);
    await mongoose_1.default.disconnect();
}
migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
