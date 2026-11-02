import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getResend, FROM_EMAIL } from "@/lib/mail/resend";

/**
 * Resend connectivity diagnostic.
 *
 * This was previously unauthenticated: anybody who knew the URL could make the
 * deployment send mail on demand (burning the Resend quota) and could read back
 * the provider's raw error payload. It is now admin-only, it mails the
 * requesting administrator rather than a hardcoded address, and provider errors
 * are logged server-side instead of being returned to the caller.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string | null; name?: string } | undefined;

  if (user?.role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.email) {
    return NextResponse.json(
      { status: "FAIL", message: "Your account has no email address configured." },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { status: "FAIL", message: "RESEND_API_KEY is missing in the deployment environment." },
      { status: 500 }
    );
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Novarea System Diagnostic",
      html: "<p>If you see this, <strong>Resend connectivity is OK</strong>.</p>",
    });

    if (error) {
      console.error("[MAIL_DIAGNOSTIC] Resend returned an error:", error);
      return NextResponse.json(
        { status: "API_ERROR", message: "Resend rejected the request. See server logs." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "OK",
      message: `Diagnostic email sent to ${user.email}. Check inbox/spam.`,
    });
  } catch (err) {
    console.error("[MAIL_DIAGNOSTIC] Unexpected failure:", err);
    return NextResponse.json(
      { status: "CRITICAL_FAILURE", message: "Mail service unreachable. See server logs." },
      { status: 500 }
    );
  }
}
