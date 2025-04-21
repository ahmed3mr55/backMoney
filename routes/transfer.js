const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const Transaction = require("../models/Transaction");
const joi = require("joi");
const nodemailer = require("nodemailer");
const {sendTransactionEmail} = require("./sendEmail/sendTransactionEmail");


// Endpoint: Get All Transactions
router.get("/transfermony", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const transactions = await Transaction.find({ $or: [{ sender: user.id }, { receiver: user.id }] }).sort({ date: -1 });
    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});


// get one transaction
router.get("/transfermony/:id", async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (!transaction.sender.toString() && !transaction.receiver.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
})

router.get("/userId", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    return res.status(200).json(user.id);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
})



router.post("/transfermony", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }

    const { receiverUsername, amount } = req.body;

    const schema = joi.object({
      receiverUsername: joi.string().required().trim().min(3),
      amount: joi.number().required(),
    });

    const { error } = schema.validate(req.body);
    if(error){
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!receiverUsername || !amount || amount <= 0) {
      return res
        .status(400)
        .json({
          message:
            "Invalid input: Receiver username and valid amount are required",
        });
    }


    const sender = await User.findById(user.id);
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }


    if (sender.money < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    if (sender.id === receiver.id) {
      return res.status(400).json({ message: "You cannot transfer to yourself" });
    }

    // run transaction
    sender.money = Number(sender.money) - Number(amount);
    receiver.money = Number(receiver.money) + Number(amount);
    


    await Promise.all([sender.save(), receiver.save()]);

    // save transaction
    const transaction = new Transaction({
      sender: sender.id,
      receiver: receiver.id,
      senderUsername: sender.username,
      receiverUsername: receiver.username,
      amount,
      date: new Date(),
      status: "Complete",
      description: `Transfer of ${amount}EGP from ${sender.username} to ${receiver.username}`,
      type: "Transfer",
    });
    await transaction.save();
    // send email
    const transactionDetails = {
      amount,
      newBalance: sender.money,
      date: new Date().toLocaleString(),
      transactionNumber: transaction.id,
      status: "Complete",
    };
    await sendTransactionEmail(transactionDetails, sender, receiver);

    return res.status(200).json({
      message: "Transfer successful",
      transaction,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});



module.exports = router;
