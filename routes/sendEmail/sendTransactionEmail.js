const express = require("express");
const nodemailer = require("nodemailer");

// send transaction email
const sendTransactionEmail = async (transactionDetails, sender, receiver) => {
  const { amount, newBalance, date, transactionNumber, status } = transactionDetails;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASS,
    },
  });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: sender.email,
    subject: "Transaction Details: Money Transfer Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
          <h1>Money Transfer Successful!</h1>
          <p>Hi ${sender.firstName}, your transaction is complete.</p>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <h2>Transaction Details</h2>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Sender Username:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${sender.username}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Receiver Username:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${receiver.username}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Transferred:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${amount} EGP</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Balance:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${newBalance} EGP</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction Number:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${transactionNumber}</td>
            </tr>
            <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>status:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${status}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
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

module.exports = { sendTransactionEmail };


