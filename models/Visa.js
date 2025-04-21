const mongoose = require("mongoose");
const joi = require("joi");

const visaSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    unique: true,
  },
  cvv: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  otp: {
    type: String,
    default: null,
  },
  expiryOtp: {
    type: Date,
    default: null
  },
});

const validateVisa = (visa) => {
  const schema = joi.object({
    cardNumber: joi.string().required().length(16),
    cvv: joi.string().required().length(3),
    expiryDate: joi.string().required(),
    user: joi.string().required(),
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    status: joi.boolean().required(),
    otp: joi.string().required(),
    expiryOtp: joi.date().required(),
  });
  return schema.validate(visa);
};

const Visa = mongoose.model("Visa", visaSchema);
module.exports = { Visa, validateVisa };
