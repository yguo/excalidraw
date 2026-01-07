import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Mock Cloud Connector for Development
// In real D1, we would use Drizzle adapter here.
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google,
        Credentials({
            name: "Local Developer",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "developer" },
            },
            async authorize(credentials) {
                // Mock user for local dev
                return {
                    id: "local-dev-id",
                    name: (credentials?.username as string) || "Developer",
                    email: "dev@example.com",
                    image: "https://github.com/shadcn.png",
                }
            }
        })
    ],
    secret: process.env.AUTH_SECRET,
    // Simple session strategy for now
    session: { strategy: "jwt" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
    },
})
