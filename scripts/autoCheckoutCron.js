// // Node.js script for scheduled auto check-out
// require('dotenv').config();
// const mongoose = require('mongoose');
// const VisitorPass = require('../models/VisitorPass').default;
// const MONGO_URI = process.env.MONGODB_URI;

// async function autoCheckout() {
//   await mongoose.connect(MONGO_URI);
//   const now = new Date();
//   const passes = await VisitorPass.find({
//     checkOutDate: null,
//     expectedCheckOutTime: { $lte: now },
//     status: { $in: ["active", "checked_in"] }
//   });
//   let updated = 0;
//   for (const pass of passes) {
//     pass.checkOutDate = now;
//     pass.status = "expired";
//     await pass.save();
//     updated++;
//   }
//   console.log(`Auto checked-out ${updated} passes.`);
//   await mongoose.disconnect();
// }

// autoCheckout().catch(err => {
//   console.error('Auto check-out failed:', err);
//   process.exit(1);
// });
