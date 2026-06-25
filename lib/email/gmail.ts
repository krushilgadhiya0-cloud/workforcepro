import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendWelcomeEmail(email: string, name: string, password?: string) {
  try {
    await transporter.sendMail({
      from: `"Krushil from WorkForcePro" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to WorkForcePro, ${name}!`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
          <h2>Hello ${name},</h2>
          <p>Welcome to WorkForcePro! We're glad to have you with us.</p>
          
          <p><strong>Your login credentials:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            ${password ? `<li>Password: <code style="background: #f4f4f4; padding: 2px 5px; border-radius: 4px;">${password}</code></li>` : '<li>Password: Use the one shared by your administrator.</li>'}
          </ul>
          
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

export async function sendPasswordResetEmail(email: string, name: string, newPassword: string) {
  try {
    await transporter.sendMail({
      from: `"WorkForcePro Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your password has been reset',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 30px;">
          <h2 style="margin-top: 0; color: #2563eb;">Password Reset Successful</h2>
          <p>Hello ${name},</p>
          <p>Your password for WorkForcePro has been successfully reset.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Your new temporary password:</p>
            <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #000; font-family: monospace;">${newPassword}</p>
          </div>
          <p style="font-size: 14px; color: #666;">For your security, please login and change this password immediately in your account settings.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">If you did not request this, please contact support immediately.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
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

export async function sendPaymentReceiptEmail(email: string, name: string, details: { plan: string; amount: number; paymentId: string; orderId: string }) {
  try {
    await transporter.sendMail({
      from: `"WorkForcePro Billing" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Payment Receipt: Your ${details.plan} is now active!`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">Payment Receipt</h2>
          <p>Hello ${name},</p>
          <p>Thank you for your payment! Your subscription to <strong>WorkForcePro</strong> has been successfully activated.</p>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Plan:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">${details.plan}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹${details.amount}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Payment Date:</td>
                <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 15px 0 0; color: #64748b; font-size: 12px;">Payment ID:</td>
                <td style="padding: 15px 0 0; text-align: right; font-size: 12px;">${details.paymentId}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 12px;">Order ID:</td>
                <td style="padding: 5px 0; text-align: right; font-size: 12px;">${details.orderId}</td>
              </tr>
            </table>
          </div>

          <p>You can now access all premium features in your dashboard.</p>
          
          <p>Best regards,<br>
          <strong>The WorkForcePro Finance Team</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send payment receipt email:', error);
    return { success: false, error };
  }
}

export async function sendContactEmail(details: { name: string, email: string, date?: string, message: string }) {
  try {
    await transporter.sendMail({
      from: `"WorkForcePro Contact" <${process.env.GMAIL_USER}>`,
      to: 'krushilgadhiya0@gmail.com',
      replyTo: details.email,
      subject: `New Inquiry from ${details.name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Contact Form Submission</h2>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b; width: 120px;">Name:</td>
                <td style="padding: 5px 0; font-weight: bold;">${details.name}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Email:</td>
                <td style="padding: 5px 0; font-weight: bold;">${details.email}</td>
              </tr>
              ${details.date ? `
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Preferred Date:</td>
                <td style="padding: 5px 0; font-weight: bold;">${details.date}</td>
              </tr>
              ` : ''}
            </table>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin-bottom: 8px; font-size: 14px;">Message:</p>
              <p style="white-space: pre-wrap; margin-top: 0;">${details.message}</p>
            </div>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This was sent via the WorkForcePro contact form.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return { success: false, error };
  }
}
