const Name = require("../models/Name");

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
  try {
    const { limit = 50, gender, style, q } = req.query;
    const query = buildQuery({ gender, style, q });
    const parsedLimit = parseLimit(limit);

    const names = await Name.find(query)
      .sort({ name: 1 })
      .limit(parsedLimit)
      .select("name")
      .lean();

    const result = names.map((entry) => entry.name);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNames,
};
