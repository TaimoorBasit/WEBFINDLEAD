import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Validate password strength again (backend)
        if (password.length < 8) {
            return NextResponse.json({ message: 'Password too short' }, { status: 400 });
        }

        const result = await AuthService.registerUser({ email, password, name });
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: error.message || 'Registration failed' }, { status: 400 });
    }
}
