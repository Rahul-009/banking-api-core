import crypto from 'crypto';

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

function getResetPasswordHtml(name, resetLink) {
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #1a56db; margin: 0; }
                .content { color: #333333; line-height: 1.6; }
                .button-container { text-align: center; margin: 30px 0; }
                .reset-button { 
                    display: inline-block; 
                    background-color: #1a56db; 
                    color: white !important; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    font-size: 16px;
                }
                .reset-button:hover { background-color: #1e40af; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
                .warning { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #92400e; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RD Bank</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We received a request to reset your password for your RD Bank account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div class="button-container">
                        <a href="${resetLink}" class="reset-button">Reset Password</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-size: 14px;">
                        ${resetLink}
                    </p>
                    <div class="warning">
                        <strong>⚠️ This link will expire in 1 hour.</strong>
                    </div>
                    <p>If you didn't request this password reset, please ignore this email or contact support.</p>
                    <p>Best regards,<br><strong>The RD Bank Team</strong></p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} RD Bank. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

export { generateResetToken, getResetPasswordHtml };
