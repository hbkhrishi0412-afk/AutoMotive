import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role is required.'],
    enum: {
      values: ['customer', 'seller', 'admin'],
      message: '{VALUE} is not a supported role.'
    }
  },
});

// The `models.User` check prevents Mongoose from recompiling the model during hot-reloads in development
const User = models.User || model('User', userSchema);

export default User;
