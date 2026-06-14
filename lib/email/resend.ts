import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'WorkForcePro <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to WorkForcePro!',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #000; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px;">WorkForcePro</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0; color: #111;">Hello ${name},</h2>
            <p>Welcome to <strong>WorkForcePro</strong>!</p>
            <p>We're excited to have you join our growing community of professionals and employers.</p>
            
            <p style="margin: 25px 0;">With WorkForcePro, you can:</p>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 8px;">✅ Create and manage your professional profile</li>
              <li style="margin-bottom: 8px;">✅ Connect with employers and recruiters</li>
              <li style="margin-bottom: 8px;">✅ Track applications and career progress</li>
              <li style="margin-bottom: 8px;">✅ Access workforce management tools</li>
            </ul>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin-top: 0; font-weight: bold;">To get started:</p>
              <ol style="margin-bottom: 0;">
                <li style="margin-bottom: 5px;">Complete your profile information.</li>
                <li style="margin-bottom: 5px;">Verify your email address.</li>
                <li style="margin-bottom: 5px;">Upload your resume and skills.</li>
                <li>Start exploring opportunities.</li>
              </ol>
            </div>

            <p>If you have any questions or need assistance, simply reply to this email and our team will be happy to help.</p>
            <p style="margin-bottom: 0;">Thank you for choosing WorkForcePro.</p>
          </div>
          <div style="padding: 30px; border-top: 1px solid #eee; text-align: center; font-size: 14px; background-color: #fcfcfc;">
            <p style="margin: 0; font-weight: bold; color: #111;">Best regards,</p>
            <p style="margin: 5px 0 0; color: #666;">The WorkForcePro Team</p>
          </div>
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
    await resend.emails.send({
      from: 'WorkForcePro <onboarding@resend.dev>',
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
