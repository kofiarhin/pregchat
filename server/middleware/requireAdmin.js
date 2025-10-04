module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "Admin only" });
  }

  const isAdmin = req.user.isAdmin === true || req.user.role === "admin";

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }

  return next();
};
