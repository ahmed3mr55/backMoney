const express = require("express");
const router = express.Router();
const { User, validateUser } = require("../models/User");
const bcrypt = require("bcrypt");
const Transaction = require("../models/Transaction");
const { format } = require("date-fns");
const Joi = require("joi");
const { Visa } = require("../models/Visa");

// Get user profile
router.get("/me", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const foundUser = await User.findById(user.id);
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(foundUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/balance", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const foundUser = await User.findById(user.id);
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ balance: foundUser.money });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update user profile
router.put("/update", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const schema = Joi.object({
      firstName: Joi.string().min(3).max(15),
      lastName: Joi.string().min(3).max(15),
      gender: Joi.string().min(3).max(5),
      dateOfBirth: Joi.date(),
      email: Joi.string().email().min(3).max(50),
      username: Joi.string()
        .min(3)
        .max(15)
        .regex(/^[a-zA-Z0-9]+$/),
      password: Joi.string().min(6).max(1024),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updates = {};
    if (req.body.firstName?.trim()) updates.firstName = req.body.firstName;
    if (req.body.lastName?.trim()) updates.lastName = req.body.lastName;
    if (req.body.gender?.trim()) updates.gender = req.body.gender;
    if (req.body.dateOfBirth?.trim()) {
      updates.dateOfBirth = format(new Date(req.body.dateOfBirth), "yyyy/M/d");
    }
    if (req.body.email?.trim()) updates.email = req.body.email;
    if (req.body.username?.trim()) updates.username = req.body.username;
    if (req.body.password?.trim()) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    const existingUser = await User.findOne({
      $or: [{ username: updates.username }, { email: updates.email }],
      _id: { $ne: user.id },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }
    const updateUser = await User.findByIdAndUpdate(user.id, updates, {
      new: true,
    });
    if (!updateUser) {
      return res
        .status(404)
        .json({ message: "Update failed. Please try again." });
    }
    if (updates.username) {
      await Transaction.updateMany(
        { sender: user.id },
        { senderUsername: updates.username }
      );
      await Transaction.updateMany(
        { receiver: user.id },
        { receiverUsername: updates.username }
      );
    }
    if (updates.firstName || updates.lastName) {
      await Visa.updateMany(
        { user: user.id },
        { firstName: updates.firstName, lastName: updates.lastName }
      );
    }
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// delete user
router.delete("/delete", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const deletedUser = await User.findByIdAndDelete(user.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
