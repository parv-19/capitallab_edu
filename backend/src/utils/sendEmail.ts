import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.NODEMAILER_USER || !process.env.NODEMAILER_PASS) {
    console.warn("Email transport is not configured.");
    return;
  }

  await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to,
    subject,
    html,
  });
};
