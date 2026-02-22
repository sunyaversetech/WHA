import { MailtrapClient } from "mailtrap";
const TOKEN = process.env.MAIL_TOKEN!;
const client = new MailtrapClient({ token: TOKEN });
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER!,
    pass: process.env.MAILTRAP_PASS!,
  },
});

const generateEmailTemplate = (verificationLink: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; padding: 20px; border-radius: 10px;">
    <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
    <p style="font-size: 16px; color: #555;">
      Thanks for signing up! To get started, please click the button below to verify your email address.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" 
         style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="font-size: 14px; color: #888;">
      This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #aaa; text-align: center;">
      &copy; ${new Date().getFullYear()} Sunyaverse Tech. All rights reserved.
    </p>
  </div>
`;

export const sendVerificationEmail = async (email: string, token: string) => {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationLink = `${domain}/verify-email?token=${token}`;

  const sender = {
    email: "sunyaverse.tech@gmail.com",
    name: "Sunyaverse",
  };

  const recipients = [{ email }];

  try {
    await client.send({
      from: sender,
      to: recipients,
      subject: "Verify your email address",
      category: "Email Verification",
      html: generateEmailTemplate(verificationLink),
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email could not be sent.");
  }
};

export const sendSimpleMail = async (
  email: string,
  subject: string,
  text: string,
) => {
  const sender = {
    email: "sunyaverse.tech@gmail.com",
    name: "Sunyaverse",
  };

  const recipients = [{ email }];

  try {
    const response = await transporter.sendMail({
      from: sender.email,
      to: email,
      subject: subject,
      text: text,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending simple email:", error);
    return { success: false, error };
  }
};
