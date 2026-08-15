import { Resend } from 'resend';

// Use environment variable for security.
// Do NOT hardcode the API key here.
export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = 'Novarea Monitoring <onboarding@resend.dev>';
