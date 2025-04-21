const express = require("express");
const router = express.Router();
const { User } = require("../../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { format } = require("date-fns")
const Transaction = require("../../models/Transaction");
const { Visa } = require("../../models/Visa");


// get all users
// GET /api/admin/getallusers?search=someQuery
router.get("/getallusers", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { search } = req.query;
    let query = {};
    if (search) {
      // البحث في البريد الإلكتروني واسم المستخدم، ويمكن توسيعه ليشمل أسماء المستخدمين أيضًا
      query = {
        $or: [
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query).select("-password").sort({ date: -1 });
    const totalUsers = users.length;
    return res.status(200).json({
      users,
      totalUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});


// get user by id
router.get("/getuser/:id", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error"});
  }
});


router.put("/update/:id", async (req, res) => {
  const user = req.user;
  try {
    if (!user || !user.isAdmin) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
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
      _id: { $ne: targetUser.id },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }
    const updateUser = await User.findByIdAndUpdate(targetUser.id, updates, {
      new: true,
    });
    if (!updateUser) {
      return res
        .status(404)
        .json({ message: "Update failed. Please try again." });
    }
    if (updates.username) {
      await Transaction.updateMany(
        { sender: targetUser.id },
        { senderUsername: updates.username }
      );
      await Transaction.updateMany(
        { receiver: targetUser.id },
        { receiverUsername: updates.username }
      );
    }
    if (updates.firstName || updates.lastName) {
      await Visa.updateMany(
        { user: targetUser.id },
        { firstName: updates.firstName, lastName: updates.lastName }
      );
    }
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});



router.get("/length-users", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const users = await User.find().select("-password");
    const totalUsers = users.length;
    return res.status(200).json({
      totalUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
})



// total money in wallet
router.get("/total-wallet-balance", async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    
    // حساب الإجمالي باستخدام aggregate
    const totalBalance = await User.aggregate([
      {
        $group: {
          _id: null, // لا حاجة لتجميع حسب أي حقل
          totalMoney: { $sum: "$money" }, // جمع قيم الحقل "money"
        },
      },
    ]);

    const total = totalBalance.length > 0 ? totalBalance[0].totalMoney : 0;

    return res.status(200).json({
      message: "Total wallet balance calculated successfully.",
      totalBalance: total,
    });
  } catch (error) {
    console.error("Error calculating total wallet balance:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/is-admin", async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }
    const userData = await User.findById(user.id).select("isAdmin");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ isAdmin: userData.isAdmin });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
