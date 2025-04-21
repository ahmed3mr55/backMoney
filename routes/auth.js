const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, validateUser } = require("../models/User");
const nodemailer = require("nodemailer");
const Joi = require("joi");
const { format } = require("date-fns");



const getLocationData = async (ip) => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    if (data.status === "success") {
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error("GeoIP Error:", error);
    return null;
  }
};


// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );
    const userIP = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.connection.remoteAddress;
    const locationData = await getLocationData(userIP); // الحصول على بيانات الموقع
    const loginDate = new Date().toLocaleString();

    const locationInfo = locationData
      ? `<p><strong>Location:</strong> ${locationData.city}, ${locationData.regionName}, ${locationData.country}</p>`
      : `<p><strong>Location:</strong> Not available</p>`;

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
      subject: "Successful Login",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1>Successful Login!</h1>
            <p>Hello ${user.firstName}, you have successfully logged into your account.</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <h2>Login Details</h2>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Login Date:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${loginDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>IP Address:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${userIP}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Location:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                  ${
                    locationData
                      ? `${locationData.city}, ${locationData.regionName}, ${locationData.country}`
                      : "Not available"
                  }
                </td>
              </tr>
            </table>
            <p>If this was not you, please contact our support immediately.</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Internal server error" });
      }
    });

    return res
      .status(200)
      .json({ message: "User logged in successfully", token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Register Route
router.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    gender,
    dateOfBirth,
  } = req.body;
  try {
    if (
      !username ||
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !gender ||
      !dateOfBirth
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const findUser = await User.findOne({ $or: [{ email }, { username }] });
    if (findUser) {
      return res.status(400).json({ message: "Invalid username or email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const formattedDate = format(new Date(dateOfBirth), "yyyy/M/d");

    const user = new User({
      username,
      email,
      password: hash,
      firstName,
      lastName,
      gender,
      dateOfBirth: formattedDate,
    });
    await user.save();

    try {
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
        subject: "Welcome to Our Platform!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
              <h2>Welcome, ${user.firstName}!</h2>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
              <p>Thank you for joining our platform, <strong>${
                user.firstName
              } ${
          user.lastName
        }</strong>. We are thrilled to have you onboard!</p>
              <p>Here are your account details:</p>
              <ul>
                <li><strong>Username:</strong> ${user.username}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Gender:</strong> ${user.gender}</li>
              </ul>
              <p>Feel free to explore our platform and let us know if you have any questions.</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://${req.headers.host}/auth/login" style="
                  background-color: #4CAF50; 
                  color: white; 
                  padding: 10px 20px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block;">
                  Log In
                </a>
              </div>
              <p>Thank you for choosing us!</p>
            </div>
            <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
              <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
            </div>
          </div>
          `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
      console.log("Email sent successfully to:", user.email);
    } catch (error) {
      console.error("Error sending email to:", user.email, error);
      throw new Error("Failed to send registration email.");
    }

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );

    return res
      .status(201)
      .json({ message: "User created successfully", token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
