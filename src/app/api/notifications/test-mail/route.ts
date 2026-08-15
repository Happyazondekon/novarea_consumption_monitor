import { NextResponse } from "next/server";
import { getResend, FROM_EMAIL } from "@/lib/mail/resend";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
        error: "RESEND_API_KEY is missing in Vercel environment.",
        status: "FAIL"
    });
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'fxmakerman@gmail.com', // Primary account owner
      subject: 'Novarea System Diagnostic',
      html: '<p>If you see this, <strong>Resend connectivity is OK</strong>.</p>'
    });

    if (error) {
        return NextResponse.json({
            error: error,
            message: "Resend API returned an error.",
            status: "API_ERROR"
        });
    }

    return NextResponse.json({
        success: true,
        data,
        message: "Email sent to fxmakerman@gmail.com. Check inbox/spam."
    });

  } catch (err: any) {
    return NextResponse.json({
        error: err.message,
        status: "CRITICAL_FAILURE"
    });
  }
}
