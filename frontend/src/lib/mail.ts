import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to resolve IPv4 addresses first to avoid ENETUNREACH errors on networks with broken IPv6 routing
dns.setDefaultResultOrder("ipv4first");

export async function sendOTP(email: string, otp: string, purpose: 'login' | 'signup') {
  let host = "smtp.gmail.com";
  try {
    const addresses = await dns.promises.resolve4("smtp.gmail.com");
    if (addresses && addresses.length > 0) {
      host = addresses[0];
      console.log(`✉️ Resolved smtp.gmail.com to IPv4: ${host}`);
    }
  } catch (dnsErr) {
    console.error("⚠️ Failed to resolve smtp.gmail.com to IPv4, falling back to default hostname:", dnsErr);
  }

  const transporter = nodemailer.createTransport({
    host: host,
    port: 465,
    secure: true,
    tls: {
      servername: "smtp.gmail.com",
    },
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  const subject = purpose === 'signup' ? "Verify your Mantis Account" : "Mantis Login Code";
  const message = purpose === 'signup' 
    ? `Welcome to Mantis! Your verification code for registration is: ${otp}. It expires in 5 minutes.`
    : `Your Mantis login verification code is: ${otp}. It expires in 5 minutes.`;

  const mailOptions = {
    from: `"Mantis Platform" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    text: message,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ff9f43; text-align: center;">Mantis Platform</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">
          ${purpose === 'signup' ? 'Thank you for registering with Mantis.' : 'You requested a verification code to log in to Mantis.'}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 24px; font-weight: bold; background-color: #f7f7f9; border: 1px dashed #ccc; padding: 10px 20px; border-radius: 4px; letter-spacing: 2px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #777;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">Mantis Diagnostic Platform &copy; 2026</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
