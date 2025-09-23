const Midwife = require("../models/Midwife");

const getMidwives = async (req, res, next) => {
  try {
    const midwives = await Midwife.find({}).sort({ name: 1 });
    res.json(midwives);
  } catch (error) {
    next(error);
  }
};

const getMidwifeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const midwife = await Midwife.findById(id);

    if (!midwife) {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    res.json(midwife);
  } catch (error) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    next(error);
  }
};

module.exports = {
  getMidwives,
  getMidwifeById,
};
