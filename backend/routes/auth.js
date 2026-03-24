const express = require('express');
const router = express.Router();
const User = require('../models/User');
const memoryDB = require('../inMemoryDB');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      // In-memory database
      const existingUser = memoryDB.users.find(u => u.email === email || u.username === username);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const newUser = {
        _id: String(memoryDB.getUserIdCounter()),
        username,
        email,
        password,
        role: role || 'user',
        createdAt: new Date()
      };
      memoryDB.users.push(newUser);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    }

    // MongoDB
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      // In-memory database
      const user = memoryDB.users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }

    // MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const users = memoryDB.users.map(u => ({ ...u, password: undefined }));
      return res.json(users);
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
