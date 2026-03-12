const User = require("../models/User");
const jwt = require("jsonwebtoken");

//Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};
//Refister User
exports.registerUser = async (req, res) => {
  const { fullName, email, password, profileImageUrl } = req.body;

  //Validation: Check for missing fields

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ message: "Hmun awl zawng zawng hi dah khah vek tur a ni." });
  }
  try {
    //check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email hman tawh a ni." });
    }
    //create the user
    const user = await User.create({
      fullName,
      email,
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
      .json({ message: "error registering user", error: err.message });
  }
};

//Login user

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Hmun awl zawng zawng hi ziah luh vek tur a ni." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Email emaw password a dik lo" });
    }
    res.status(200).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "error registering user", error: err.message });
  }
};

//Get user Info

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
      .json({ message: "error registering user", error: err.message });
  }
};
