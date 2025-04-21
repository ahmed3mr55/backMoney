const mongoose = require("mongoose");

const visaTransactionSchema = new mongoose.Schema({
    visa: {
        type: mongoose.Schema.Types.ObjectId, // ID sender
        ref: "Visa",
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
    status: {
        type: String,
        default: "pending",
    },
    type: {
        type: String,
        default: "payment",
    },
});

const VisaTransaction = mongoose.model("VisaTransaction", visaTransactionSchema);

module.exports = { VisaTransaction };