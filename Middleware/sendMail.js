const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// Optional: verify connection once at startup
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

// Send email function
const sendEmail = async (to, subject, body) => {
  try {
    const mailOptions = {
      from: `"Menya-Rwanda" <${process.env.AUTH_EMAIL}>`,
      to,
      subject,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email sent successfully:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;