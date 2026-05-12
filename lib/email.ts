import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendInviteEmail = async (
  to: string,
  workspaceName: string,
  invitedBy: string
) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email.')
    return
  }

  try {
    await resend.emails.send({
      from: 'TaskFlow <onboarding@resend.dev>', // You should update this to your verified domain later
      to,
      subject: `You've been invited to join ${workspaceName} on TaskFlow`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
          <h1 style="color: #0891b2; font-size: 24px; margin-bottom: 16px;">You're invited to TaskFlow!</h1>
          <p style="font-size: 16px; line-height: 24px;">Hi there,</p>
          <p style="font-size: 16px; line-height: 24px;"><strong>${invitedBy}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on TaskFlow.</p>
          <div style="margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3003'}" 
               style="background-color: #0891b2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">
               Join Workspace
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">TaskFlow helps individuals and teams crush their goals with beautiful Kanban boards, real-time alerts, and seamless collaboration.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you weren't expecting this invitation, you can safely ignore this email.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send invite email:', error)
  }
}
