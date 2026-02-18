import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ message: 'Missing email or OTP' }, { status: 400 });
        }

        const result = await AuthService.verifyUser(email, otp);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Verification failed' }, { status: 400 });
    }
}
