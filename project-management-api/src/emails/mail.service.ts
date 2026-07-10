import nodemailer from 'nodemailer';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Utility to send emails. Falls back to console logger if credentials are missing or during development.
 */
export const sendEmail = async ({ to, subject, text, html }: SendEmailArgs): Promise<void> => {
  try {
    const from = process.env.EMAIL_FROM || 'no-reply@aegis.com';

    // If SMTP credentials are dummy/missing, log instead of throwing error to prevent blockages
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) {
      logger.info(`[Email Sandbox] Email sent to: ${to}`);
      logger.info(`[Email Sandbox] Subject: ${subject}`);
      logger.info(`[Email Sandbox] Text content: ${text}`);
      return;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email successfully sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    // Do not throw error so that auth processes do not crash due to email service failures
  }
};

/**
 * Sends a verification email with link.
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const subject = 'Verify Your Email Address - Aegis';
  const text = `Welcome to Aegis! Please verify your email by clicking: ${verifyUrl}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to Aegis</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">Please verify your email address to activate your account and start managing your projects.</p>
      <div style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Or copy and paste this link in your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

/**
 * Sends a password reset email.
 */
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = 'Reset Your Password - Aegis';
  const text = `Reset your Aegis password by clicking: ${resetUrl}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">You requested to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">If you didn't request a password reset, please secure your account.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Or copy and paste this link in your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};
