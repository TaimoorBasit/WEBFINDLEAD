import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.email },
                            { username: credentials.email }, // Allow login with username in "email" field
                        ]
                    },
                });

                if (!user) {
                    throw new Error("Account not found. Please register.");
                }

                if (!user.password) {
                    throw new Error("Account has no password set. Try social login.");
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error("Incorrect password. Please try again.");
                }

                if (user.isBlocked) {
                    throw new Error("Account is blocked. Contact support.");
                }

                if (!user.isVerified) {
                    throw new Error("Email not verified. Please check your inbox.");
                }

                return {
                    id: user.id,
                    name: user.name || "",
                    email: user.email || "",
                    role: user.role || "USER",
                    plan: user.plan || "FREE",
                    image: user.image || "",
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.plan = (user as any).plan;
                token.leadsBalance = (user as any).leadsBalance;
            }

            // Sync with DB to handle role updates/blocks/balance changes without re-login
            if (token.id) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { role: true, plan: true, leadsBalance: true, isBlocked: true, cardLast4: true, cardBrand: true, subscriptionStatus: true, planType: true, isVerified: true }
                    });

                    if (freshUser) {
                        if (freshUser.isBlocked) {
                            // Optional: Force signout logic or handle in middleware
                        }

                        token.role = freshUser.role;
                        token.plan = freshUser.plan;
                        token.leadsBalance = freshUser.leadsBalance;
                        token.cardLast4 = freshUser.cardLast4;
                        token.cardBrand = freshUser.cardBrand;
                        token.subscriptionStatus = freshUser.subscriptionStatus;
                        token.planType = freshUser.planType;
                    }
                } catch (error) {
                    console.error("Error refreshing token:", error);
                }
            }

            // Update session if user updates profile from client side
            if (trigger === "update" && session) {
                token.name = session.name;
                token.plan = session.plan;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).plan = token.plan;
                (session.user as any).leadsBalance = token.leadsBalance;
                (session.user as any).cardLast4 = token.cardLast4;
                (session.user as any).cardBrand = token.cardBrand;
                (session.user as any).subscriptionStatus = token.subscriptionStatus;
                (session.user as any).planType = token.planType;
            }
            return session;
        },
    },
};
