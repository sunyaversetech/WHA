import { MailtrapClient } from "mailtrap";

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
  const domain = process.env.NEXT_PUBLIC_APP_URL!;
  const verificationLink = `${domain}/verify-email?token=${token}`;
  const client = new MailtrapClient({ token: process.env.MAIL_TOKEN! });

  const sender = {
    email: "no-reply@whaustralia.com",
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

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email could not be sent.");
  }
};

export const sendSimpleMail = async (
  email: string,
  subject: string,
  text: string,
  html?: string,
) => {
  const client = new MailtrapClient({ token: process.env.MAIL_TOKEN! });
  try {
    const sender = {
      email: "no-reply@whaustralia.com",
      name: "WhAustralia",
    };

    const recipients = [{ email }];
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: subject,
      text: text,
      html: html,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

const generateEventTicketTemplate = (
  eventName: string,
  code: string,
  userName: string,
) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #051e3a; border-radius: 15px; overflow: hidden;">
      <div style="background-color: #051e3a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Your Event Ticket</h1>
      </div>
      <div style="padding: 30px; text-align: center; color: #333;">
        <p style="font-size: 18px;">Hi <strong>${userName}</strong>,</p>
        <p>Thanks for getting your ticket for <strong>${eventName}</strong>!</p>
        
        <div style="margin: 30px 0;">
          <img src="${qrUrl}" alt="Ticket QR Code" style="border: 10px solid #f4f4f4; border-radius: 10px;" />
          <p style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin-top: 10px; color: #051e3a;">
            ${code}
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          Present this QR code or the Coupon Code at the entrance for verification.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} WHAustralia. All rights reserved.
      </div>
    </div>
  `;
};

export const sendEventTicketEmail = async (
  email: string,
  eventName: string,
  code: string,
  userName: string,
) => {
  const client = new MailtrapClient({ token: process.env.MAIL_TOKEN! });
  try {
    await client.send({
      from: { email: "no-reply@whaustralia.com", name: "WHA Australia" },
      to: [{ email }],
      subject: `Your Ticket for ${eventName}`,
      html: generateEventTicketTemplate(eventName, code, userName),
    });
    return { success: true };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false };
  }
};
