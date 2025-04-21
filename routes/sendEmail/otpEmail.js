const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

async function sendOTPEmail(user, otpCode) {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: user.email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="background-color: #007BFF; color: white; text-align: center; padding: 20px;">
          <h2 style="margin: 0; font-size: 24px;">Your OTP Code</h2>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #333;">
          <h3 style="margin-top: 0;">Hello ${user.firstName},</h3>
          <p style="font-size: 16px;">We received a request to access your account. Use the OTP code below to complete the process:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #007BFF; letter-spacing: 5px;">${otpCode}</span>
          </div>
          <p style="font-size: 14px;">This OTP is valid for the next <strong>5 minutes</strong>. Please do not share it with anyone.</p>
          <p style="margin-top: 30px; font-size: 14px;">If you did not request this, please ignore this email or contact our support team immediately.</p>
        </div>
        <div style="background-color: #f9f9f9; text-align: center; padding: 10px; font-size: 12px; color: #777; border-top: 1px solid #ddd;">
          <p style="margin: 0;">Thank you for using our service!</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} App Money</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = {
  sendOTPEmail,
};
