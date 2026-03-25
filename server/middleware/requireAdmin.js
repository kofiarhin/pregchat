module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "Admin only" });
  }

  if (req.user.isAdmin !== true) {
    return res.status(403).json({ message: "Admin only" });
  }

  return next();
};
