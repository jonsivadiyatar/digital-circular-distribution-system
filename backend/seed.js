require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const adminExists = await User.findOne({ email: 'admin@demo.com' });
    if (!adminExists) {
      await new User({
        username: 'Admin',
        email: 'admin@demo.com',
        password: 'admin123',
        role: 'admin'
      }).save();
      console.log('Created admin account');
    }

    const userExists = await User.findOne({ email: 'user@demo.com' });
    if (!userExists) {
      await new User({
        username: 'User',
        email: 'user@demo.com',
        password: 'user123',
        role: 'user'
      }).save();
      console.log('Created user account');
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
