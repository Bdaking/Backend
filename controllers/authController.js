const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Register User
exports.registerUser = async (req, res) => {
  const { fullName, email, phoneNumber, password, profileImageUrl } = req.body;

  // Validation: Ensure Full Name, Password, and at least one contact method exists
  if (!fullName || !password || (!email && !phoneNumber)) {
    return res
      .status(400)
      .json({ message: "Hmun awl zawng zawng hi dah khah vek tur a ni." });
  }

  try {
    // Check if email or phone already exists using the $or operator
    const query = [];
    if (email) query.push({ email });
    if (phoneNumber) query.push({ phoneNumber });

    const existingUser = await User.findOne({ $or: query });

    if (existingUser) {
      return res.status(400).json({
        message: "Email emaw Phone Number hman tawh a ni.",
      });
    }

    // Create the user
    const user = await User.create({
      fullName,
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      password,
      profileImageUrl,
    });

    res.status(201).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  // We use 'identifier' to represent either email or phone number
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Hmun awl zawng zawng hi ziah luh vek tur a ni." });
  }

  try {
    // Search for user where identifier matches EITHER email OR phoneNumber
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({
        message: "Email/Phone emaw password a dik lo.",
      });
    }

    res.status(200).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// Get user Info
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user info", error: err.message });
  }
};
