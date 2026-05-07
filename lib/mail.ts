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
      name: "Whats Happening Australia",
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
        <h1 style="color: white; margin: 0;">Your Ticket</h1>
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
          Present this QR code or the Ticket or Code at the entrance for verification.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Whats Happening Australia. All rights reserved.
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

const generateMultipleEventTicketTemplate = (
  eventName: string,
  codes: string[],
  userName: string,
) => {
  const ticketsHtml = codes
    .map((code, index) => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${code}`;
      return `
        <div style="
          border: 2px dashed #051e3a; 
          border-radius: 12px; 
          padding: 24px; 
          margin: 16px 0; 
          text-align: center;
          background-color: #fafafa;
        ">
          <p style="
            font-size: 13px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            color: #888; 
            margin: 0 0 12px 0;
          ">
            Ticket ${index + 1} of ${codes.length}
          </p>

          <img 
            src="${qrUrl}" 
            alt="QR Code for ticket ${index + 1}" 
            style="border: 8px solid #eee; border-radius: 8px; display: block; margin: 0 auto;" 
          />

          <p style="
            font-family: monospace; 
            font-size: 20px; 
            font-weight: bold; 
            letter-spacing: 4px; 
            margin: 14px 0 0 0; 
            color: #051e3a;
          ">
            ${code}
          </p>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; border: 2px solid #051e3a; border-radius: 15px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #051e3a; padding: 28px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">🎟 Your Tickets</h1>
        <p style="color: #a0b4c8; margin: 8px 0 0 0; font-size: 14px;">${eventName}</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px; color: #333;">
        <p style="font-size: 17px; margin: 0 0 6px 0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; color: #555; margin: 0 0 24px 0;">
          Your booking is confirmed! You have <strong>${codes.length} ticket${codes.length > 1 ? "s" : ""}</strong> 
          for <strong>${eventName}</strong>. Each ticket has a unique QR code — present them individually at the entrance.
        </p>

        <!-- Ticket Cards -->
        ${ticketsHtml}

        <!-- Note -->
        <div style="
          margin-top: 28px; 
          padding: 16px; 
          background-color: #fffbea; 
          border-left: 4px solid #f5a623; 
          border-radius: 4px;
          font-size: 13px;
          color: #7a6000;
        ">
          ⚠️ <strong>Important:</strong> Each QR code is valid for one person only. 
          Do not share or duplicate these codes — each will be verified individually at entry.
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Whats Happening Australia. All rights reserved.
      </div>
    </div>
  `;
};

export const sendEventMultipleTicketEmail = async (
  email: string,
  eventName: string,
  codes: string[],
  userName: string,
) => {
  const client = new MailtrapClient({ token: process.env.MAIL_TOKEN! });
  try {
    await client.send({
      from: {
        email: "no-reply@whaustralia.com",
        name: "Whats Happening Australia",
      },
      to: [{ email }],
      subject: `Your ${codes.length} Ticket${codes.length > 1 ? "s" : ""} for ${eventName}`,
      html: generateMultipleEventTicketTemplate(eventName, codes, userName),
    });
    return { success: true };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false };
  }
};
