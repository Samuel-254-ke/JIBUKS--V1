import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"JIBUKS Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendInvitationEmail = async (email, password, inviterName, familyName) => {
    try {
        const subject = `Invitation to join ${familyName || 'Family'} on Jibuks`;
        const text = `Hello,\n\n${inviterName} has invited you to join their family on Jibuks.\n\nHere are your login details:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nWelcome to Jibuks!`;
        const html = `
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join their family on Jibuks.</p>
            <p>Here are your login details:</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please change your password after logging in.</p>
            <br>
            <p>Welcome to Jibuks!</p>
        `;

        return await sendEmail({ to: email, subject, text, html });
    } catch (error) {
        console.error('Error sending invitation email:', error);
        throw error;
    }
};
