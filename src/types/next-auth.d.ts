import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: string
            plan: string
            id: string
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        plan: string
        id: string
    }
}
