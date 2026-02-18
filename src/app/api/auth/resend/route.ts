import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        const result = await AuthService.resendOtp(email);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to resend' }, { status: 400 });
    }
}
