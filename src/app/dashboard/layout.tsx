import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileMenu } from "@/components/MobileMenu";
import { TutorialProvider } from "@/components/TutorialProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <TutorialProvider>
        <div className="flex h-screen bg-white dark:bg-[#09090b] overflow-hidden transition-colors duration-500">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
            <Topbar />
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-black/20">
            {children}
            </main>
            <MobileMenu />
        </div>
        </div>
    </TutorialProvider>
  );
}
