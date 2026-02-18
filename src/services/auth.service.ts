import { prisma } from '@/lib/prisma';
import { generateSecureOTP, hashValue, verifyHash } from '@/utils/security';
import { sendEmail } from '@/utils/email';
import bcrypt from 'bcryptjs';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS_PER_HOUR = 3;

export class AuthService {
    static async registerUser({ email, password, name }: any) {
        // 1. Check existing
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new Error('Email already registered');
            } else {
                // User exists but unverified. Update password and resend OTP.
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const otp = generateSecureOTP();
        const otpHash = await hashValue(otp);
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Create or Update
        if (existingUser) {
            await prisma.user.update({
                where: { email },
                data: {
                    name,
                    password: hashedPassword,
                    otpHash,
                    otpExpiry,
                    otpAttempts: 0,
                    lastOtpSentAt: new Date(),
                    // Reset resend count on new registration attempt?
                    otpResendCount: 0
                }
            });
        } else {
            await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    otpHash,
                    otpExpiry,
                    lastOtpSentAt: new Date(),
                    otpResendCount: 0,
                    role: 'USER',
                    isVerified: false,
                }
            });
        }

        // Send Email
        await sendEmail(
            email,
            'Verify Your Email Address',
            `<h2>Welcome to WebFindLead!</h2><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
        );
        return { success: true, message: 'Verification code sent' };
    }

    static async verifyUser(email: string, otp: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');
        if (user.isVerified) return { success: true, message: 'Already verified' };

        // Check attempts
        if (user.otpAttempts >= MAX_ATTEMPTS) {
            throw new Error('Too many failed attempts. Please request a new code.');
        }

        // Check expiry
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            throw new Error('Code expired. Please request a new one.');
        }

        // Verify Hash
        const isValid = await verifyHash(otp, user.otpHash || '');
        if (!isValid) {
            await prisma.user.update({
                where: { email },
                data: { otpAttempts: { increment: 1 } }
            });
            throw new Error(`Invalid code. ${MAX_ATTEMPTS - (user.otpAttempts + 1)} attempts remaining.`);
        }

        // Success
        await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                otpHash: null,
                otpExpiry: null,
                otpAttempts: 0,
                emailVerified: new Date(), // Standard NextAuth field
            }
        });

        return { success: true };
    }

    static async resendOtp(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');
        if (user.isVerified) throw new Error('Already verified');

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Calculate effective resend count (reset if hour passed)
        let currentResendCount = user.otpResendCount;
        if (user.lastOtpSentAt && user.lastOtpSentAt < oneHourAgo) {
            currentResendCount = 0;
        }

        if (currentResendCount >= MAX_RESENDS_PER_HOUR) {
            throw new Error('Too many resend attempts. Please wait an hour before requesting again.');
        }

        // Cooldown check (60s)
        if (user.lastOtpSentAt) {
            const diff = (now.getTime() - user.lastOtpSentAt.getTime()) / 1000;
            if (diff < RESEND_COOLDOWN_SECONDS) {
                throw new Error(`Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - diff)} seconds.`);
            }
        }

        const otp = generateSecureOTP();
        const otpHash = await hashValue(otp);
        const otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: {
                otpHash,
                otpExpiry,
                otpAttempts: 0,
                lastOtpSentAt: now,
                otpResendCount: currentResendCount + 1
            }
        });

        await sendEmail(
            email,
            'Your New Verification Code',
            `<h2>Reset Verification Code</h2><p>Your new verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
        );
        return { success: true, message: 'Code resent' };
    }
}
