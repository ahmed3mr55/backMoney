const express = require("express");
const router = express.Router();
const Transaction = require("../../models/Transaction");
const { User } = require("../../models/User");
const e = require("express");
const joi = require("joi");

// Endpoint: Get All Transactions
router.get("/transactions", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const transactions = await Transaction.find().sort({ date: -1 });
    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

// Endpoint: Deposit Money by Admin
router.post("/deposit", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { username, amount } = req.body;
    const schema = joi.object({
      username: joi.string().required().trim().min(3).max(15),
      amount: joi.number().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!username || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    // العثور على المستخدم الهدف
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Add the amount to the target user
    targetUser.money += amount;
    await targetUser.save();

    // save transaction
    const transaction = new Transaction({
      sender: admin.id,
      receiver: targetUser.id,
      senderUsername: "Admin",
      receiverUsername: targetUser.username,
      amount,
      date: new Date(),
      status: "Complete",
      description: `Deposit of ${amount} from Admin to ${targetUser.username}`,
      type: "deposit",
    });
    await transaction.save();

    return res.status(200).json({
      message: "Deposit successful.",
      user: {
        id: targetUser._id,
        username: targetUser.username,
        newBalance: targetUser.money,
      },
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

// Endpoint: Deduct Money
router.post("/deduct", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { username, deduct } = req.body;

    const schema = joi.object({
      username: joi.string().required().trim().min(3).max(15),
      deduct: joi.number().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!username || !deduct || deduct <= 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    targetUser.money -= deduct;
    await targetUser.save();

    // hestory of transaction
    const transaction = new Transaction({
      sender: admin.id,
      receiver: targetUser.id,
      senderUsername: admin.username || "Admin",
      receiverUsername: targetUser.username,
      amount: deduct,
      date: new Date(),
      status: "Complete",
      description: `Deduct of ${deduct} from Admin to ${targetUser.username}`,
      type: "deduct",
    });
    await transaction.save();

    return res.status(200).json({
      message: "Deduct successful.",
      user: {
        id: targetUser._id,
        username: targetUser.username,
        newBalance: targetUser.money,
      },
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

module.exports = router;
