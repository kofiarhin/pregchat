const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ensureSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
};

const signToken = (user) => {
  ensureSecret();
  return jwt.sign(
    { id: user._id.toString(), isAdmin: user.isAdmin === true },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const buildUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  region: user.region,
  isAdmin: user.isAdmin === true,
});

const register = async (req, res) => {
  try {
    const { name, email, password, region } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = new User({
      name,
      email,
      passwordHash: password,
      region: region || "UK",
    });

    await user.save();

    const token = signToken(user);

    return res.status(201).json({ token, user: buildUserResponse(user) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({ token, user: buildUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) =>
  res.json({
    user: buildUserResponse(req.user),
  });

module.exports = {
  register,
  login,
  me,
};
