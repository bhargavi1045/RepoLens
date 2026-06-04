import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<void> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - RepoLens',
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background: #0a0a0a; color: #e0e0e0; padding: 20px; border-radius: 8px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ff6b00; margin: 0;">RepoLens</h2>
              <p style="color: #888888; margin: 5px 0 0 0; font-size: 12px;">Reset Your Password</p>
            </div>
            
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p style="color: #d0d0d0; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="
                display: inline-block;
                background: linear-gradient(135deg, #ff6b00, #ff8c3a);
                color: white;
                padding: 12px 32px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
              ">Reset Password</a>
            </div>
            
            <p style="color: #888888; font-size: 12px;">
              Or copy this link: <br/>
              <code style="background: #111111; padding: 4px 8px; border-radius: 4px; color: #ff8c3a;">${resetUrl}</code>
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(255, 107, 0, 0.1); margin: 20px 0;" />
            
            <p style="color: #555555; font-size: 12px; margin: 0;">
              This link will expire in 24 hours. If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error}`);
    throw new Error('Failed to send password reset email');
  }
};

export const sendPasswordResetConfirmation = async (
  email: string,
  userName: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Changed Successfully - RepoLens',
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background: #0a0a0a; color: #e0e0e0; padding: 20px; border-radius: 8px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ff6b00; margin: 0;">RepoLens</h2>
              <p style="color: #888888; margin: 5px 0 0 0; font-size: 12px;">Password Updated</p>
            </div>
            
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p style="color: #d0d0d0; line-height: 1.6;">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="
                display: inline-block;
                background: linear-gradient(135deg, #ff6b00, #ff8c3a);
                color: white;
                padding: 12px 32px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
              ">Go to Login</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid rgba(255, 107, 0, 0.1); margin: 20px 0;" />
            
            <p style="color: #555555; font-size: 12px; margin: 0;">
              If you didn't make this change, please reset your password immediately and contact support.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset confirmation email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset confirmation email: ${error}`);
    throw new Error('Failed to send confirmation email');
  }
};
