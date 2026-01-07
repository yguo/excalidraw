import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <div className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">E</span>
          </div>
          <span>EPad</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underlines-offset-4" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underlines-offset-4" href="#">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underlines-offset-4" href="#">
            About
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Personal Whiteboard, Reimagined.
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Secure, private, and shareable. EPad brings the power of Excalidraw to your personal cloud.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button>Get Started</Button>
                </Link>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 EPad Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
