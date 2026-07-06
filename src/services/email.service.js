import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send email
export const sendEmail = async (to, subject, html) => {
    const { data, error } = await resend.emails.send({
        from: "RD Bank <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
    });

    if (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return data;
};


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to RD Bank';
    const html = `<p>Hello ${name},</p><p>Thank you for registering at RD Bank. We're excited to have you on board!</p><p>Best regards,<br>The RD Bank Team</p>`;

    await sendEmail(userEmail, subject, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, html);
}

export default {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};