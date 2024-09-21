const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  course: { type: String, enum: ['MCA', 'BCA', 'BSC'], required: true },
  designation: {
    type: String,
    enum: ['HR', 'Manager', 'Sales'],
    required: true,
  },
  createdAt: {
    type: String,
    default: () => {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return new Date().toLocaleDateString('en-GB', options); // Format: 14 Feb 2023
    },
  },
});

const User1 = mongoose.model('User1', UserSchema);

module.exports = User1;
