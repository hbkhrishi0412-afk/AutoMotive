
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required.']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required.']
  },
  role: {
    type: String,
    required: [true, 'Role is required.'],
    enum: {
      values: ['customer', 'seller', 'admin'],
      message: '{VALUE} is not a supported role.'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  dealershipName: String,
  bio: String,
  logoUrl: String,
  subscriptionPlan: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free',
  },
  featuredCredits: {
    type: Number,
    default: 0
  },
  usedCertifications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt managed by Mongoose
});

// The `models.User` check prevents Mongoose from recompiling the model during hot-reloads in development
const User = models.User || model('User', userSchema);

export default User;