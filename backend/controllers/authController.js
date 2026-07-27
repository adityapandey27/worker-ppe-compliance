const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const login = async (req, res) => {
  console.log("Login request received:", req.body);
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

    // ✅ Cookie configuration
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed.",
      error: err.message,
    });
  }
};

const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

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
