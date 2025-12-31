import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Security check for CRON_SECRET if on Vercel
    const authHeader = request.headers.get('authorization');
    if (process.env.VERCEL_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 1. Get all users who have email notifications enabled
        const users = await (prisma.user as any).findMany({
            where: {
                emailNotifications: true,
                email: { not: "" },
            },
            include: {
                tasks: {
                    where: {
                        status: { not: 'DONE' },
                        dueDate: {
                            lte: twentyFourHoursFromNow,
                            gt: now,
                        },
                    },
                },
            },
        });

        const results = [];

        // 2. Process each user
        for (const user of users) {
            if (user.tasks.length === 0) continue;

            try {
                await resend.emails.send({
                    from: 'TaskFlow Reminders <onboarding@resend.dev>',
                    to: user.email!,
                    subject: `You have ${user.tasks.length} tasks due soon!`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0891b2;">TaskFlow Reminders</h2>
              <p>Hi ${user.name || 'there'}, you have tasks that need your attention in the next 24 hours:</p>
              <ul style="list-style: none; padding: 0;">
                ${(user.tasks as any[]).map((task: any) => `
                  <li style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-left: 4px solid #0891b2; border-radius: 4px;">
                    <div style="font-weight: bold; font-size: 16px;">${task.title}</div>
                    <div style="color: #666; font-size: 14px; margin-top: 4px;">${task.description || 'No description'}</div>
                    <div style="color: #0891b2; font-size: 12px; margin-top: 8px;">Due: ${new Date(task.dueDate!).toLocaleString()}</div>
                  </li>
                `).join('')}
              </ul>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">You can disable these emails in your TaskFlow settings.</p>
            </div>
          `,
                });
                results.push({ email: user.email, status: 'sent' });
            } catch (emailError) {
                console.error(`Failed to send email to ${user.email}:`, emailError);
                results.push({ email: user.email, status: 'failed', error: String(emailError) });
            }
        }

        return NextResponse.json({
            success: true,
            processed: users.length,
            results
        });

    } catch (error) {
        console.error('CRON ERROR:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
