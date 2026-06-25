const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = [
      { email: 'owner@gmail.com', password: 'owner123', role: 'owner', firstName: 'Owner' },
      { email: 'admin@gmail.com', password: 'admin123', role: 'admin', firstName: 'Admin' },
      { email: 'platform@gmail.com', password: 'platform123', role: 'platform', firstName: 'Platform' },
      { email: 'presales@gmail.com', password: 'presales123', role: 'presales', firstName: 'PreSales' },
      { email: 'qa@gmail.com', password: 'qa123', role: 'qa', firstName: 'QA' },
      { email: 'enterprise@gmail.com', password: 'enterprise123', role: 'enterprise', firstName: 'Enterprise' },
      { email: 'sre@gmail.com', password: 'sre123', role: 'sre', firstName: 'SRE' }
    ];
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await User.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        firstName: userData.firstName
      });
      console.log(`Created user: ${userData.email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUsers();