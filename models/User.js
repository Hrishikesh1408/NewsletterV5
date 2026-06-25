import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  department: String,
  role: { 
    type: String, 
    enum: ['owner', 'admin', 'platform', 'presales', 'qa', 'enterprise', 'sre'], 
    default: 'admin' 
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    newsletterReminders: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
