import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";

/**
 * The login screen used to be a pure client component, which made it a static
 * page: the browser (and the App Router cache) could re-display it to an
 * already-authenticated user, which is how a signed-in technician could
 * navigate "back" onto the login form.
 *
 * Rendering it dynamically behind a server-side session check means the HTML is
 * never produced for someone who already holds a session.
 */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}
