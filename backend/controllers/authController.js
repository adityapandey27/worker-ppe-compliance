const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // localhost
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({
      message: "Login failed.",
      error: err.message,
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");

  res.json({
    message: "Logged out",
  });
};

const getMe = (req, res) => {
  res.json({
    user: req.user.toSafeObject(),
  });
};

module.exports = {
  login,
  logout,
  getMe,
};