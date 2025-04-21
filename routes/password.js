const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const Joi = require("joi");

// Forgot Password template
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

// send forgot password Link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.SECRET_KEY + user.password,
      { expiresIn: "15m" }
    );
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const link = `https://front-money-cash.vercel.app/auth/password/reset-password/${user._id}/${token}`;
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
      },
    });
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: "Reset Your Password",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f44336; color: white; text-align: center; padding: 20px;">
        <h2>Password Reset Request</h2>
      </div>
      <div style="padding: 20px; line-height: 1.6;">
        <h3 style="color: #333;">Hello ${user.firstName},</h3>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${link}" target="_blank" style="
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn’t request a password reset, you can ignore this email.</p>
        <p style="font-size: 12px; color: #555;">This link will expire in 15 minutes.</p>
      </div>
      <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
        <p>Thank you for using our service!</p>
      </div>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Internal server error", error });
      }
      res.status(200).json({ message: "Email sent successfully" });
    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

// get reset password Link
router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    const secret = process.env.SECRET_KEY + user.password;
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Access denied." });
      }
    });
    res.status(200).json({email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

// reset password
router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password, confirmPassword } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const schema = Joi.object({
      password: Joi.string().required().min(6).max(1024),
      confirmPassword: Joi.string().required().min(6).max(1024),
    })
    const { error } = schema.validate(req.body);
    if(error){
      return res.status(400).json({ message: error.details[0].message });
    }
    const user = await User.findById(id);
    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    if (await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: "New password cannot be the same as the old password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user.password = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.redirect(302, "https://front-money-cash.vercel.app/auth/password/success-password");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;