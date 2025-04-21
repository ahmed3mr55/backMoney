const { required } = require("joi");
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId, // ID Sender
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId, // ID Receiver
    ref: "User",
    required: true,
  },
  senderUsername: {
    type: String,
    required: true,
  },
  receiverUsername: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String, // Type of transaction (Transfer, Payment, etc.)
    required: true,
  },
  description: {
    type: String, // description of the transaction
  },
  status: {
    type: String, // Status of the transaction (Complete, Pending, Failed)
    default: "pending",
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
