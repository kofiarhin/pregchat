const Item = require("../models/Item");

const getStoreItems = async (req, res, next) => {
  try {
    const items = await Item.find({}).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

const getStoreItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const createStoreItem = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const item = await Item.create(payload);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoreItems,
  getStoreItemById,
  createStoreItem,
};
