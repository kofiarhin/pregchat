const Name = require("../models/Name");
const { sampleNames } = require("../data/sampleNames.json");

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50;
  }
  return Math.min(parsed, 200);
};

const buildQuery = ({ gender, style, q }) => {
  const query = {};

  if (gender) {
    query.gender = gender;
  }

  if (style) {
    query.style = style;
  }

  if (q) {
    query.name = { $regex: q, $options: "i" };
  }

  return query;
};

const getNames = async (req, res, next) => {
  return res.json(sampleNames);
};

module.exports = {
  getNames,
};
