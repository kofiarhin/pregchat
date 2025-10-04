/* One-time: node server/seedAdmin.js user@example.com */
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const email = process.argv[2] || process.env.ADMIN_EMAIL;
if (!email) { console.error('Provide email: node server/seedAdmin.js user@example.com'); process.exit(1); }

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const res = await User.updateOne({ email }, { $set: { isAdmin: true } });
    console.log(res.matchedCount ? `✅ Promoted ${email} to admin` : `⚠️ No user found for ${email}`);
    process.exit(0);
  } catch (e) {
    console.error(e); process.exit(1);
  }
})();
