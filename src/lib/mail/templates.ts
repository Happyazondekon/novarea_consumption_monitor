import { FROM_EMAIL, resend } from "./resend";

/**
 * Dispatches an email notification for a new operational mission/instruction.
 */
export async function sendMissionEmail(toEmail: string, techName: string, adminName: string, text: string) {
  if (!toEmail) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '🚨 New Operational Mission - Novarea Textiles',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
          <h2 style="color: #2563eb; text-transform: uppercase;">New Mission Assigned</h2>
          <p>Hello <strong>${techName}</strong>,</p>
          <p>A new operational directive has been broadcasted by <strong>${adminName}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-weight: bold; color: #4b5563; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Instruction:</p>
            <p style="margin-top: 5px; font-size: 16px;">${text}</p>
          </div>
          <p>Please log in to the dashboard to mark this mission as completed once finished.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Novarea Textiles Monitoring System • Industrial Intelligence Unit</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send Mission Email to:", toEmail, error);
  }
}

/**
 * Dispatches an email notification to administrators for a new field submission.
 */
export async function sendReadingAlertEmail(toEmail: string, adminName: string, techName: string, category: string, value: number) {
  if (!toEmail) return;

  const unit = category === 'POWER' ? 'kWh' : 'm³';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `📊 New ${category} Reading Logged - Pending Audit`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
          <h2 style="color: #2563eb; text-transform: uppercase;">Field Submission Alert</h2>
          <p>Hello <strong>${adminName}</strong>,</p>
          <p>A new meter reading has been captured on the factory floor by <strong>${techName}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-size: 12px; text-transform: uppercase; padding-bottom: 5px;">Resource</td>
                <td style="color: #64748b; font-size: 12px; text-transform: uppercase; padding-bottom: 5px;">Index Value</td>
              </tr>
              <tr>
                <td style="font-weight: bold; font-size: 16px; color: #2563eb;">${category}</td>
                <td style="font-weight: bold; font-size: 16px;">${value} ${unit}</td>
              </tr>
            </table>
          </div>
          <p>This entry is currently in <strong>PENDING AUDIT</strong> status. Please review and validate it in the Reporting Hub.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Novarea Textiles Monitoring System • Industrial Intelligence Unit</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send Reading Alert Email to:", toEmail, error);
  }
}
