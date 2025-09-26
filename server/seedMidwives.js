if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Midwife = require("./models/Midwife");

const seedMidwives = async () => {
  try {
    await connectDB();

    const count = await Midwife.countDocuments();

    if (count > 0) {
      console.log("Midwives already seeded. Skipping seeding.");
      return;
    }

    const midwives = [
      {
        name: "Sarah N.",
        bio: "Gentle prenatal support focused on nutrition and confident birthing.",
        specialties: ["Prenatal care", "Nutrition"],
        photo: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=400&q=80",
        availability: [
          { weekday: 1, startTime: "09:00", endTime: "15:00" },
          { weekday: 3, startTime: "09:00", endTime: "15:00" },
          { weekday: 5, startTime: "09:00", endTime: "15:00" },
        ],
        appointmentDurationMin: 30,
      },
      {
        name: "Amara B.",
        bio: "Helps families plan for birth and navigate the fourth trimester with calm.",
        specialties: ["Birth planning", "Postnatal"],
        photo: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80",
        availability: [
          { weekday: 2, startTime: "10:00", endTime: "16:00" },
          { weekday: 4, startTime: "10:00", endTime: "16:00" },
        ],
        appointmentDurationMin: 45,
      },
      {
        name: "Lucy K.",
        bio: "Offers grounding education and mental health support for parents-to-be.",
        specialties: ["Anxiety support", "Education"],
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        availability: [
          { weekday: 6, startTime: "10:00", endTime: "14:00" },
        ],
        appointmentDurationMin: 30,
      },
    ];

    await Midwife.insertMany(midwives);
    console.log(`Seeded ${midwives.length} midwives.`);
  } catch (error) {
    console.error("Failed to seed midwives:", error);
  } finally {
    await mongoose.connection.close();
  }
};

seedMidwives();
