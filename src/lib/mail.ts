import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
    },
});

export const sendOTP = async (verifyEmail: string, otp: string) => {
    try {
        if (!(process.env.SMTP_USER || process.env.SMTP_EMAIL) || !process.env.SMTP_PASS) {
            console.log(`[DEV MODE] OTP for ${verifyEmail}: ${otp}`);
            return { success: true };
        }

        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.SMTP_EMAIL,
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

export const sendPasswordReset = async (to: string, link: string) => {
    try {
        if (!(process.env.SMTP_USER || process.env.SMTP_EMAIL) || !process.env.SMTP_PASS) {
            console.log(`[DEV MODE] Password reset link for ${to}: ${link}`);
            return { success: true };
        }
        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.SMTP_EMAIL,
            to,
            subject: 'Reset your password - WebFindLead',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset your password</h2>
                    <p>Click the button below to choose a new password.</p>
                    <p><a href="${link}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a></p>
                    <p style="font-size:12px;color:#888;">This link expires in 1 hour. If you didn't request it, ignore this email.</p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: 'Failed to send email' };
    }
};

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

async function notify(to: string, subject: string, body: string) {
    try {
        if (!(process.env.SMTP_USER || process.env.SMTP_EMAIL) || !process.env.SMTP_PASS) {
            console.log(`[DEV MODE] Email to ${to}: ${subject}`);
            return;
        }
        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.SMTP_EMAIL,
            to,
            subject,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${body}</div>`,
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

export const sendHelpReply = (to: string, subject: string, reply: string) =>
    notify(to, `Re: ${subject} - WebFindLead Support`, `<h2>Support replied to your request</h2><p><b>${esc(subject)}</b></p><div style="background:#f4f4f4;padding:16px;border-radius:8px;">${esc(reply)}</div>`);

export const sendAdminTicketNotice = (from: string, subject: string, message: string) => {
    const admin = process.env.ADMIN_EMAIL;
    return admin ? notify(admin, `New support ticket: ${subject}`, `<p>From: ${esc(from)}</p><p><b>${esc(subject)}</b></p><p>${esc(message)}</p>`) : Promise.resolve();
};
