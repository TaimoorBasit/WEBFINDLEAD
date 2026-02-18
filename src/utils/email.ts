import nodemailer from 'nodemailer';

/**
 * Reusable Email Service using Nodemailer and Gmail SMTP.
 * Built for production-safe OTP and transactional email delivery.
 */

// Validate SMTP environment variables
const validateConfig = () => {
    const required = ['SMTP_EMAIL', 'SMTP_PASS'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Email Service Error: Missing environment variables: ${missing.join(', ')}`);
    }
};

/**
 * Sends an email using the configured Gmail SMTP transport.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML content of the email
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // Run validation
        validateConfig();

        console.log(`📡 [Email Service]: Attempting to send via ${process.env.SMTP_EMAIL} using host smtp.gmail.com:465`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS?.trim(), // Ensure no trailing spaces
            },
            debug: true, // Enable debug
            logger: true // Enable logger
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ [Email Service]: Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error(`❌ [Email Service]: Failed to send email to ${to}. Error:`, error.message);
        return {
            success: false,
            error: error.message || 'Internal Email Service Error'
        };
    }
};

/**
 * EXAMPLE USAGE FOR OTP EMAIL
 * 
 * const htmlPayload = `
 *   <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
 *     <h2>Verification Code</h2>
 *     <p>Your OTP code is: <strong>123456</strong></p>
 *     <p>This code expires in 10 minutes.</p>
 *   </div>
 * `;
 * 
 * await sendEmail('user@example.com', 'Your OTP Verification Code', htmlPayload);
 */
