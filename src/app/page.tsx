import { redirect } from "next/navigation";

export default function RootPage() {
  // Always start with login to ensure authorized entry
  redirect("/login");
}
