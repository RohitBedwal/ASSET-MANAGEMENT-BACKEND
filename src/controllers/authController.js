import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow admin role if the request is from an existing admin
    let userRole = 'user';
    if (role === 'admin') {
      // Check if there are any existing users
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // First user becomes admin
        userRole = 'admin';
      } else if (req.user && req.user.role === 'admin') {
        // Only existing admins can create new admins
        userRole = 'admin';
      }
    }

    const user = await User.create({ name, email, password, role: userRole });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && user.isActive && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile (Protected)
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (user) res.json(user);
  else res.status(404).json({ message: 'User not found' });
};

// ✅ Export them correctly
export { registerUser, loginUser, getUserProfile };
