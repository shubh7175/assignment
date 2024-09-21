const Admin = require('../models/Admin');
const express = require('express');
const bcrypt = require('bcrypt');
const router1 = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// Route to register a new admin
const userSchema = Joi.object({
  name: Joi.string().trim().min(3).max(30).required().messages({
    'string.base': '"Name" should be a type of text',
    'string.empty': '"Name" cannot be an empty field',
    'string.min': '"Name" should have a minimum length of {#limit}',
    'string.max': '"Name" should have a maximum length of {#limit}',
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } }) // Set to true if you want to allow TLD checking
    .required()
    .messages({
      'string.base': '"Email" should be a type of text',
      'string.empty': '"Email" cannot be an empty field',
      'string.email': '"Email" must be a valid email',
    }),

  password: Joi.string().min(5).required().messages({
    'string.base': '"Password" should be a type of text',
    'string.empty': '"Password" cannot be an empty field',
    'string.min': '"Password" should have a minimum length of {#limit}',
  }),
});
router1.post('/register-admin', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, email, password } = req.body;

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({ name, email, password: hashedPassword });

  try {
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully', admin });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router1.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existuser = await Admin.findOne({ email });

    if (!existuser) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, existuser.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: existuser._id }, process.env.secret, {
      expiresIn: '9h',
    });
    return res.status(200).json({
      message: 'Token generated successfully',
      token,
      name: existuser.name,
      email: existuser.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router1;
