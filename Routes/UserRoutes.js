const express = require('express');
const User1 = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const joi = require('joi');
const authenticationToken = require('../Controller/Authentication');
const Admin = require('../models/Admin');

const router = express.Router();
const jwt_secret = process.env.secret;

// Define user schema for validation
const userschema = joi.object({
  email: joi.string().email().required(),
  // password: joi.string().min(5).required(),
  name: joi.string().optional(),
  phone: joi
    .string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a 10-digit number',
      'any.required': 'Phone number is required',
    }),
  gender: joi.string().valid('male', 'female').required(),
  course: joi.string().valid('MCA', 'BCA', 'BSC').required(),
  designation: joi.string().valid('HR', 'Manager', 'Sales').required(),
});

// User registration
router.post('/register', authenticationToken, async (req, res) => {
  const { error } = userschema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details });
  }

  const userId = req.existuser.id; // Get user ID from the token

  try {
    // Find the user to ensure they are an admin
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the userId matches the admin's ID
    if (!userId || user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Validate and create new employee data from the request body
    const { name, email, phone, gender, course, designation } = req.body;

    // Optional: Add validation for the incoming data (use Joi or similar)
    // Example validation could be done here

    // Create a new employee document
    const newEmployee = new User1({
      name,
      email,
      phone,
      gender,
      course,
      designation,
      createdAt: new Date(), // Set it to the current date
    });

    // Save the new employee to the database
    await newEmployee.save();
    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login

// Get paginated employee list
router.get('/employees', authenticationToken, async (req, res) => {
  const userId = req.existuser.id; // Get user ID from the token
  // Find the user to ensure they are an admin
  const user = await Admin.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if the userId matches the admin's ID
  if (!userId || user._id.toString() !== userId) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  const page = parseInt(req.query.page) || 1; // Current page, defaults to 1
  const limit = 4; // Number of employees per page
  const skip = (page - 1) * limit; // Calculate how many to skip
  const validSortFields = ['name', 'email', 'createdAt']; // Define valid sort fields
  const sortField = validSortFields.includes(req.query.sortField)
    ? req.query.sortField
    : 'name'; // Default sort by name
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Default sort order is ascending

  // console.log('Sort Field:', sortField); // Log for debugging
  //console.log('Sort Order:', sortOrder); // Log for debugging

  try {
    const employees = await User1.find({}, { password: 0 })
      .sort({ [sortField]: sortOrder })
      .skip(skip) // Skip the number of employees based on the page
      .limit(limit); // Limit the number of employees returned

    const totalEmployees = await User1.countDocuments(); // Get total number of employees
    res.status(200).json({
      totalEmployees,
      totalPages: Math.ceil(totalEmployees / limit), // Calculate total pages
      currentPage: page,
      employees,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search employees by name
router.get('/search', authenticationToken, async (req, res) => {
  const userId = req.existuser.id; // Get user ID from the token
  // Find the user to ensure they are an admin
  const user = await Admin.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if the userId matches the admin's ID
  if (!userId || user._id.toString() !== userId) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  const searchTerm = req.query.name ? req.query.name : ''; // Get the search term

  try {
    const employees = await User1.find(
      { name: { $regex: searchTerm, $options: 'i' } }, // Search for employees by name
      { password: 0 } // Exclude the password field
    );

    res.status(200).json({
      totalResults: employees.length,
      employees,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete own account
router.delete('/employees/:id', authenticationToken, async (req, res) => {
  try {
    //console.log(req.user);
    const userId = req.existuser.id; // Get user ID from the token
    // console.log(userId);
    const employee = await User1.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        message: 'employee not found',
      });
    }
    // Find the user and delete their details
    const user = await Admin.findById(userId);
    // console.log(user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!userId || user._id.toString() != userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    // Delete the user
    await User1.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/employees/:id', authenticationToken, async (req, res) => {
  try {
    const userId = req.existuser.id; // Get user ID from the token
    const employeeId = req.params.id;

    // Find the employee by ID
    const employee = await User1.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find the user (admin) and verify authorization
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Update employee details
    const updatedData = req.body; // Get updated data from the request body
    const updatedEmployee = await User1.findByIdAndUpdate(
      employeeId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
