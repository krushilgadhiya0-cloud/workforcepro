import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await transporter.sendMail({
      from: `"Krushil from WorkForcePro" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to WorkForcePro, ${name}!`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
          <h2>Hello ${name},</h2>
          <p>Welcome to WorkForcePro! We're glad to have you with us.</p>
          
          <p>You can now start managing your tasks, workers, and payments directly from your dashboard.</p>
          
          <p><strong>To get started:</strong></p>
          <ul>
            <li>Complete your profile information</li>
            <li>Verify your business details</li>
            <li>Add your first worker</li>
          </ul>

          <p>If you need any help, just reply to this email and I'll be happy to assist you personally.</p>
          
          <p>Best regards,<br>
          <strong>The WorkForcePro Team</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendOtpEmail(email: string, otp: string) {
  try {
    await transporter.sendMail({
      from: `"WorkForcePro" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${otp} is your WorkForcePro verification code`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 40px 30px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
          <h1 style="margin-top: 0;">Verification Code</h1>
          <p style="color: #666;">Please use the following 6-digit code to verify your account registration.</p>
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #000;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error };
  }
}

export async function sendSubscriptionReminderEmail(email: string, name: string, daysLeft: number, plan: string) {
  try {
    await transporter.sendMail({
      from: `"WorkForcePro Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Action Required: Your ${plan} subscription ends in ${daysLeft} days`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
          <h2>Hello ${name},</h2>
          <p>This is a friendly reminder from WorkForcePro.</p>
          
          <p>Your <strong>${plan}</strong> subscription is set to expire in <strong>${daysLeft} days</strong>. To ensure your business operations continue without any interruption, please renew your plan soon.</p>
          
          <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">Once your subscription expires, "Add" features for Workers, Tasks, and Payments will be locked until a new plan is active.</p>
          </div>

          <p>You can renew your subscription by visiting the <strong>Owner Payments</strong> section in your dashboard.</p>
          
          <p>If you have any questions or need help with the renewal, just reply to this email!</p>
          
          <p>Best regards,<br>
          <strong>The WorkForcePro Team</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send subscription reminder email:', error);
    return { success: false, error };
  }
}
