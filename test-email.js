const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('--- Email Test Script ---');
    console.log('Email:', process.env.SMTP_EMAIL);
    console.log('Pass Length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().length : 0);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '',
        },
        debug: true,
        logger: true
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: 'Test Email from WebFind',
            text: 'If you see this, email is working!',
            html: '<b>If you see this, email is working!</b>'
        });
        console.log('✅ Success! Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Body:', error.message);
    }
}

testEmail();
