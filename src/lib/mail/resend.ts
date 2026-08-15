import { Resend } from 'resend';

// We lazy-initialize the Resend client to avoid build-time errors
// when the environment variable might be missing.
let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    // During local development or build if key is missing,
    // we use a placeholder to prevent the constructor from crashing.
    resendInstance = new Resend(apiKey || 're_placeholder_for_build');
  }
  return resendInstance;
};

// SIMPLIFIED: Standard Resend testing sender (No display name)
export const FROM_EMAIL = 'onboarding@resend.dev';
