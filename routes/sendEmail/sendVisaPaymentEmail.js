const express = require("express");
const nodemailer = require("nodemailer");

const sendVisaPaymentEmail = async (user, transaction, cardLast4) => {
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
    subject: "Payment Successful - Visa Transaction",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #007bff; color: white; text-align: center; padding: 20px;">
          <h1>✅ Payment Successful</h1>
          <p>Dear ${user.firstName}, your payment has been processed successfully.</p>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <h2>Transaction Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Card Holder:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${user.firstName} ${user.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Card Number:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">**** **** **** ${cardLast4}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Paid:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${transaction.amount} EGP</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Balance:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${user.money} EGP</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date(transaction.date).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${transaction.id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Method:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" width="50" alt="Visa Logo">
              </td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} App Money. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendVisaPaymentEmail };
