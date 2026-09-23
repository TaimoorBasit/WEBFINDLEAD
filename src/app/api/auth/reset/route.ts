import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { token, password } = await req.json().catch(() => ({}));
    if (typeof token !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
        return NextResponse.json({ error: 'Password must be 8+ chars, include 1 uppercase, 1 number, 1 special char.' }, { status: 400 });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.verificationToken.findUnique({ where: { token: hash } });
    if (!record || !record.identifier.startsWith('reset:') || record.expires < new Date()) {
        return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const email = record.identifier.slice('reset:'.length);
    await prisma.user.updateMany({ where: { email }, data: { password: await bcrypt.hash(password, 10) } });
    await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }); // one-time use
    return NextResponse.json({ ok: true });
}
