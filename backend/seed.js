const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createDefaultUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = [
      { email: 'owner@gmail.com', password: 'owner123', firstName: 'Owner', lastName: 'User', department: 'Management', role: 'owner' },
      { email: 'admin@gmail.com', password: 'admin123', firstName: 'Admin', lastName: 'User', department: 'IT', role: 'admin' },
      { email: 'platform@gmail.com', password: 'platform123', firstName: 'Platform', lastName: 'User', department: 'Engineering', role: 'platform' },
      { email: 'presales@gmail.com', password: 'presales123', firstName: 'Presales', lastName: 'User', department: 'Sales', role: 'presales' },
      { email: 'qa@gmail.com', password: 'qa123', firstName: 'QA', lastName: 'User', department: 'Quality', role: 'qa' },
      { email: 'enterprise@gmail.com', password: 'enterprise123', firstName: 'Enterprise', lastName: 'User', department: 'Solutions', role: 'enterprise' },
      { email: 'sre@gmail.com', password: 'sre123', firstName: 'SRE', lastName: 'User', department: 'Operations', role: 'sre' }
    ];
    
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`${userData.role} user created: ${userData.email}`);
      } else {
        console.log(`${userData.role} user already exists: ${userData.email}`);
      }
    }
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Owner: owner@gmail.com / owner123');
    console.log('Admin: admin@gmail.com / admin123');
    console.log('Platform: platform@gmail.com / platform123');
    console.log('Presales: presales@gmail.com / presales123');
    console.log('QA: qa@gmail.com / qa123');
    console.log('Enterprise: enterprise@gmail.com / enterprise123');
    console.log('SRE: sre@gmail.com / sre123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createDefaultUsers();