const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token)
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.', error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user)
      return res
        .status(401)
        .json({ message: 'Invalid token.', error: 'Invalid token.' });
    req.user = user; // includes isAdmin
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token.', error: 'Invalid token.' });
  }
};

module.exports = { requireAuth };
