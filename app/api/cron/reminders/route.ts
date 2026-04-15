import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTaskReminderEmail } from '@/lib/email';

export async function GET(request: Request) {
  // Optional security: Check an Authorization header to ensure only Vercel can trigger this
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // We want to find tasks that have a dueDate within the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
        reminderSent: false,
        status: {
          not: 'DONE',
        },
      },
      include: {
        user: true,
      },
    });

    if (dueTasks.length === 0) {
      return NextResponse.json({ message: 'No tasks due soon' }, { status: 200 });
    }

    const emailPromises = dueTasks.map(async (task) => {
      // Send email
      if (task.user.email) {
        await sendTaskReminderEmail(
          task.user.email,
          task.user.name,
          task.title,
          task.description,
          task.dueDate!
        );
        
        // Mark as sent so we don't spam the user on the next cron run
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSent: true },
        });
      }
    });

    // Wait for all emails to send
    await Promise.allSettled(emailPromises);

    return NextResponse.json(
      { message: `Successfully processed ${dueTasks.length} reminders.` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reminder cron:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
