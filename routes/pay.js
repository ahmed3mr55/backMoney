const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const { Visa } = require("../models/Visa");
const { VisaTransaction } = require("../models/VisaTransaction");
const Joi = require("joi");
const { sendVisaPaymentEmail } = require("./sendEmail/sendVisaPaymentEmail");
const { sendOTPEmail } = require("./sendEmail/otpEmail");
const e = require("express");

function generateRandomOtp() {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += Math.floor(Math.random() * 10);
  }

  return {
    otp,
  };
}

router.post("/pay", async (req, res) => {
  const { amount, cardNumber, cvv, expiryDate, otp, username } = req.body;
  try {
    if (!amount || !cardNumber || !cvv || !expiryDate || !otp || !username) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const schema = Joi.object({
      amount: Joi.number().required(),
      cardNumber: Joi.string().required(),
      cvv: Joi.string().required(),
      expiryDate: Joi.string().required(),
      otp: Joi.string().required(),
      username: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const visa = await Visa.findOne({ cardNumber });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }
    
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentDate = new Date();
    const [currentMonth, currentYear] = [
      String(currentDate.getMonth() + 1).padStart(2, "0"),
      String(currentDate.getFullYear()).slice(-2),
    ];
    const currentExpiryDate = `${currentMonth}/${currentYear}`;

    if (visa.expiryDate < currentExpiryDate) {
      return res.status(400).json({ message: "Visa has expired" });
    }

    if (visa.cvv !== cvv || visa.expiryDate !== expiryDate) {
      return res.status(400).json({ message: "Invalid card details" });
    }

    if (!visa.status) {
      return res.status(400).json({ message: "Visa is not active" });
    }

    if (!visa.otp || visa.otp !== otp) {
      return res.status(400).json({ message: "Invalid or missing OTP" });
    }

    if (visa.expiryOtp && new Date(visa.expiryOtp) < currentDate) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const user = await User.findById(visa.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check balance
    const balance = Number(user.money);
    if (balance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let creditTransaction;

  
    if (user._id.toString() === targetUser._id.toString()) {
      // The payment is for the same user
      user.money = balance - amount;
      await user.save();

      const debitTransaction = new VisaTransaction({
        visa: visa.id,
        amount,
        date: new Date(),
        status: "Complete",
        type: "Debit",
      });
      await debitTransaction.save();

      user.money = Number(user.money) + Number(amount);
      await user.save();

      creditTransaction = new VisaTransaction({
        visa: visa.id,
        amount,
        date: new Date(),
        status: "Complete",
        type: "Credit",
      });
      await creditTransaction.save();
    } else {
      // The payment is for a different user
      // Check if the target user has a visa card
      user.money = balance - amount;
      await user.save();

      const debitTransaction = new VisaTransaction({
        visa: visa.id,
        amount,
        date: new Date(),
        status: "Complete",
        type: "Debit",
      });
      await debitTransaction.save();

      targetUser.money = Number(targetUser.money) + Number(amount);
      await targetUser.save();

      creditTransaction = new VisaTransaction({
        visa: visa.id,
        amount,
        date: new Date(),
        status: "Complete",
        type: "Credit",
      });
      await creditTransaction.save();
    }

    visa.otp = null;
    visa.expiryOtp = null;
    await visa.save();

    const cardLast4 = cardNumber.slice(-4);

    try {
      await sendVisaPaymentEmail(user, creditTransaction, cardLast4);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    return res.status(200).json({ message: "Payment successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});


router.post("/send-otp", async (req, res) => {
  const { cardNumber } = req.body;
  try {
    if (!cardNumber) {
      return res.status(400).json({ message: "Invalid card number" });
    }

    const visa = await Visa.findOne({ cardNumber });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }

    const user = await User.findById(visa.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateRandomOtp();

    visa.otp = otp.otp;
    visa.expiryOtp = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes
    await visa.save();

    await sendOTPEmail(user, otp.otp);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
