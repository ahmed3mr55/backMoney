const mongoose = require("mongoose");
const Joi = require("joi");

// User Schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        const trimmedUsername = v.trim();
        return /^[a-z-0-9_-]+$/.test(trimmedUsername);
      },
      message: "Username must contain only letters, numbers, underscores, or hyphens with no spaces.",
    },
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  money: {
    type: Number,
    default: 100000,
  },
  gender: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

// Validation Function
const validateUser = (user) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .required()
      .trim()
      .max(15)
      .pattern(/^\S+$/)
      .messages({
        "string.empty": "First name is required.",
        "string.max": "First name must be less than or equal to 15 characters.",
        "string.pattern.base": "First name must not contain spaces.",
      }),
    lastName: Joi.string().required().trim().max(15).pattern(/^\S+$/).messages({
      "string.empty": "Last name is required.",
      "string.max": "Last name must be less than or equal to 15 characters.",
      "string.pattern.base": "Last name must not contain spaces.",
    }),
    username: Joi.string()
      .required()
      .trim()
      .min(3)
      .max(15)
      .regex(/^[a-zA-Z0-9]+$/)
      .messages({
        "string.empty": "Username is required.",
        "string.min": "Username must be at least 3 characters.",
        "string.max": "Username must not exceed 15 characters.",
      }),
    email: Joi.string().required().trim().lowercase().email().messages({
      "string.empty": "Email is required.",
      "string.email": "Email must be a valid email address.",
    }),
    password: Joi.string().required().min(6).max(1024).trim().messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 6 characters.",
      "string.max": "Password must not exceed 1024 characters.",
    }),
    isAdmin: Joi.boolean().default(false).messages({
      "boolean.base": "isAdmin must be true or false.",
    }),
    money: Joi.number().messages({
      "number.base": "Money must be a valid number.",
    }),
    gender: Joi.string().required().trim().messages({
      "string.empty": "Gender is required.",
    }),
    dateOfBirth: Joi.date(),
  });
  return schema.validate(user, { abortEarly: false });
};

// Mongoose Model
const User = mongoose.model("User", userSchema);

module.exports = { User, validateUser };
