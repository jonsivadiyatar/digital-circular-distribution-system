const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection with fallback to in-memory database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fullstack-app';
let USE_MEMORY_DB = false;

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    USE_MEMORY_DB = false;
  })
  .catch((err) => {
    console.warn('⚠️  MongoDB not available, using in-memory database (demo mode)');
    console.log('ℹ️  To use MongoDB: Install MongoDB locally or use MongoDB Atlas');
    USE_MEMORY_DB = true;
  });

// Export flag for routes to use
app.set('USE_MEMORY_DB', () => USE_MEMORY_DB);

// Import routes
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const circularRoutes = require('./routes/circulars');

// Use routes
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/circulars', circularRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5001; // Changed default port to 5001
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

if (USE_MEMORY_DB) {
  const setupInMemoryDB = require('./inMemoryDB');
  setupInMemoryDB(app);
}

const memoryDB = require('./inMemoryDB');

app.post('/api/circulars', (req, res) => {
  const newCircular = {
    _id: memoryDB.getNextCircularId(),
    ...req.body,
    createdAt: new Date(),
    views: 0
  };

  memoryDB.circulars.push(newCircular);
  res.status(201).json(newCircular);
});
