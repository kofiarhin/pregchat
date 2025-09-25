const Profile = require("../models/Profile");

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      "name",
      "weeks",
      "days",
      "dueDate",
      "frequency",
      "health",
      "isFirstPregnancy",
      "sex",
    ];
    const payload = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    });

    const doc = await Profile.findByIdAndUpdate(id, payload, { new: true });
    if (!doc) {
      return res.status(404).send("Profile not found");
    }
    res.json(doc);
  } catch (error) {
    res.status(500).send(error.message || "Update failed");
  }
};

module.exports = { updateProfile };
