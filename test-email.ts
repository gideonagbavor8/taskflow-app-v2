import { loadEnvConfig } from '@next/env';
loadEnvConfig('./');

async function runTest() {
  console.log('Checking RESEND_API_KEY...');
  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY is not found in .env!');
    process.exit(1);
  }

  // NOTE: On Resend's free tier, you can ONLY send emails to the email address 
  // you used to sign up for Resend.
  const myEmail = 'gideonagbavor8@gmail.com'; 

  console.log(`Attempting to send email to ${myEmail}...`);

  try {
    const { sendTaskReminderEmail } = await import('./lib/email');
    const result = await sendTaskReminderEmail(
      myEmail,
      'Gideon',
      'Deploy the App to Vercel',
      'Finalize the deployment and check environment variables.',
      new Date(Date.now() + 2 * 60 * 60 * 1000) // Due in 2 hours
    );
    console.log('Success! Email sent. Response from Resend:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

runTest();
