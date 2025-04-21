const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const { Visa } = require("../models/Visa");
const { VisaTransaction } = require("../models/VisaTransaction");

function generateRandomNumber() {
  let number = "";
  for (let i = 0; i < 16; i++) {
    number += Math.floor(Math.random() * 10);
  }

  let cvv = "";
  for (let i = 0; i < 3; i++) {
    cvv += Math.floor(Math.random() * 10);
  }

  const currentDate = new Date();
  const randomMonths = Math.floor(Math.random() * 60) + 1; // Number of months to add (1-60)
  currentDate.setMonth(currentDate.getMonth() + randomMonths);

  const expiryMonth = String(currentDate.getMonth() + 1).padStart(2, "0"); // Get the month (MM)
  const expiryYear = String(currentDate.getFullYear()).slice(2); // Get the last two digits of the year (YY)

  return {
    number,
    cvv,
    date: `${expiryMonth}/${expiryYear}`, // Format as MM/YY
  };
}

// Endpoint: Add Visa
router.post("/visaG", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const findUser = await User.findById(user.id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingVisa = await Visa.findOne({ user: user.id || user._id });
    if (existingVisa) {
      return res.status(400).json({ message: "User already has a visa" });
    }

    const visaData = generateRandomNumber();
    const visa = new Visa({
      cardNumber: visaData.number,
      cvv: visaData.cvv,
      expiryDate: visaData.date, // MM/YY format
      user: user.id,
      firstName: findUser.firstName,
      lastName: findUser.lastName,
    });

    await visa.save();
    return res.status(200).json({ message: "Visa added successfully", visa });
  } catch (error) {
    console.error("Error adding visa:");
    return res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/visa", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const visa = await Visa.findOne({ user: user.id || user._id });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }
    return res.status(200).json(visa);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }


    const deletedVisa = await Visa.findOneAndDelete({
      user: user.id || user._id,
    });
    if (!deletedVisa) {
      return res.status(404).json({ message: "Visa not found" });
    }


    await VisaTransaction.deleteMany({ visa: deletedVisa._id });

    return res.status(200).json({ message: "Visa deleted successfully" });
  } catch (error) {
    console.error("Error deleting visa:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/check", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const visa = await Visa.findOne({ user: user.id || user._id });
    return res.status(200).json({ visa: !!visa });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/transactions", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const visa = await Visa.findOne({ user: user.id || user._id });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }
    const transactions = await VisaTransaction.find({ visa: visa._id }).sort({
      date: -1,
    });
    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/checkActive", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }
    const visa = await Visa.findOne({ user: user.id || user._id });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }
    return res.status(200).json({ status: visa.status });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/toggleStatus", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }
    const visa = await Visa.findOne({ user: user.id || user._id });
    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }
    if (visa.status === undefined) {
      return res.status(400).json({ message: "Visa status is not defined" });
    }
    visa.status = !visa.status;

    await visa.save();

    const statusMessage = visa.status ? "Visa activated successfully" : "Visa deactivated successfully";
    return res.status(200).json({ message: statusMessage, status: visa.status });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
