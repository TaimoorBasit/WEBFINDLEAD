import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendOTP = async (verifyEmail: string, otp: string) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[DEV MODE] OTP for ${verifyEmail}: ${otp}`);
            return { success: true };
        }

        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: verifyEmail,
            subject: 'Your Verification Code - WebFindLead',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify Your Email</h2>
                    <p>Use the following code to verify your email address and complete your signup:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #888;">This code will expire in 10 minutes.</p>
                </div>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: 'Failed to send email' };
    }
};
