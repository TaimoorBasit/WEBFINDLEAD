import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordReset } from '@/lib/mail';

export async function POST(req: Request) {
    const { email } = await req.json().catch(() => ({}));
    const addr = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const user = addr ? await prisma.user.findFirst({ where: { email: addr } }) : null;
    // Only send if the account exists and uses a password; respond identically either way.
    if (user?.email && user.password) {
        const token = crypto.randomBytes(32).toString('hex');
        const identifier = `reset:${user.email}`;
        await prisma.verificationToken.deleteMany({ where: { identifier } });
        await prisma.verificationToken.create({
            data: {
                identifier,
                token: crypto.createHash('sha256').update(token).digest('hex'),
                expires: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
        await sendPasswordReset(user.email, `${base}/auth/reset?token=${token}`);
    }
    return NextResponse.json({ ok: true });
}
