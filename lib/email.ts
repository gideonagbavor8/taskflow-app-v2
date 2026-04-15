import { Resend } from 'resend';

// Initialize with environment variable
// Note: If RESEND_API_KEY is missing, initialization won't fail here but will fail on send.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTaskReminderEmail(
  email: string, 
  userName: string | null, 
  taskTitle: string, 
  taskDescription: string, 
  dueDate: Date
) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(dueDate);

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';

  try {
    const data = await resend.emails.send({
      from: 'TaskFlow Reminders <onboarding@resend.dev>', // Default fallback for Resend testing
      to: email,
      subject: `Reminder: Task "${taskTitle}" is due soon!`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px;">TaskFlow Reminder</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #374151;">
            <p style="font-size: 16px; line-height: 1.5;">Hi ${userName || 'there'},</p>
            <p style="font-size: 16px; line-height: 1.5;">This is a quick reminder that your pending task is coming due soon.</p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #4F46E5; padding: 15px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #111827;">${taskTitle}</h3>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #4B5563;"><strong>Due:</strong> ${formattedDate}</p>
              ${taskDescription ? `<p style="margin: 0; font-size: 14px; color: #6B7280;">${taskDescription}</p>` : ''}
            </div>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${baseUrl}/dashboard" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Open TaskFlow Dashboard</a>
            </div>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">You are receiving this because you have an upcoming task in TaskFlow.</p>
          </div>
        </div>
      `,
    });
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
