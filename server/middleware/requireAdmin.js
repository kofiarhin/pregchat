module.exports = (req, res, next) => {
  if (!req.user || req.user.isAdmin !== true) return res.status(403).json({ message: 'Admin only' });
  return next();
};
