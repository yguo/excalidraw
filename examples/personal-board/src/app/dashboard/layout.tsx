import { auth } from "@/auth"
import { Sidebar } from "@/components/Sidebar"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Middleware should handle this, but double check.
    if (!session?.user) {
        redirect("/api/auth/signin?callbackUrl=/dashboard")
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <Sidebar user={session.user} />
            </div>
            <div className="flex flex-col">
                {/* Mobile Header could go here */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
