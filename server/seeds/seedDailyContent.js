const mongoose = require("mongoose");
const DailyContent = require("../models/DailyContent");

const generateDailyContent = () => {
  const content = [];

  for (let day = 0; day <= 280; day++) {
    const week = Math.floor(day / 7) + 1;
    const trimester = week <= 12 ? 1 : week <= 26 ? 2 : 3;

    let babyUpdate = "";
    let momUpdate = "";
    let tips = "";

    // Baby updates based on gestational week
    if (week === 1) {
      babyUpdate =
        "Your baby is just a tiny cluster of cells, about the size of a poppy seed.";
    } else if (week <= 4) {
      babyUpdate = `Your baby is now ${week} weeks old and developing rapidly.`;
    } else if (week <= 8) {
      babyUpdate = `Week ${week}: Your baby's major organs are forming. Heart is beating!`;
    } else if (week <= 12) {
      babyUpdate = `Week ${week}: Baby is about ${
        week - 4
      } inches long. Facial features developing.`;
    } else if (week <= 16) {
      babyUpdate = `Week ${week}: Baby can hear your voice and is moving around!`;
    } else if (week <= 20) {
      babyUpdate = `Week ${week}: Baby is swallowing and kicking. Gender may be visible on ultrasound.`;
    } else if (week <= 24) {
      babyUpdate = `Week ${week}: Baby's lungs are developing. Weight is about 1.3 pounds.`;
    } else if (week <= 28) {
      babyUpdate = `Week ${week}: Baby can open eyes and has eyelashes. Brain developing rapidly.`;
    } else if (week <= 32) {
      babyUpdate = `Week ${week}: Baby is gaining weight quickly, about 4 pounds now.`;
    } else if (week <= 36) {
      babyUpdate = `Week ${week}: Baby's lungs are mature. Getting ready for birth!`;
    } else {
      babyUpdate = `Week ${week}: Your baby is full term and ready to meet you!`;
    }

    // Mother updates based on trimester
    if (trimester === 1) {
      momUpdate = "You may experience nausea, fatigue, and breast tenderness.";
    } else if (trimester === 2) {
      momUpdate =
        "Energy levels improving. You might feel baby movements soon!";
    } else {
      momUpdate =
        "Baby is growing rapidly. Prepare for birth and newborn care.";
    }

    // Tips based on week
    if (week <= 12) {
      tips =
        "Take prenatal vitamins daily. Stay hydrated and rest when needed.";
    } else if (week <= 24) {
      tips =
        "Continue prenatal care. Eat nutritious foods and stay active safely.";
    } else {
      tips =
        "Prepare birth plan. Pack hospital bag. Practice relaxation techniques.";
    }

    content.push({
      day,
      babyUpdate,
      momUpdate,
      tips,
      assets: [],
      references: [],
    });
  }

  return content;
};

const seedDailyContent = async () => {
  try {
    console.log("Seeding daily content...");

    // Clear existing content
    await DailyContent.deleteMany({});

    // Generate and insert new content
    const content = generateDailyContent();
    await DailyContent.insertMany(content);

    console.log(`Successfully seeded ${content.length} days of content`);
  } catch (error) {
    console.error("Error seeding daily content:", error);
    throw error;
  }
};

module.exports = seedDailyContent;

// Run if called directly
if (require.main === module) {
  require("dotenv").config();
  const connectDB = require("../config/db");

  connectDB().then(() => {
    seedDailyContent()
      .then(() => {
        console.log("Seeding completed successfully");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Seeding failed:", error);
        process.exit(1);
      });
  });
}
