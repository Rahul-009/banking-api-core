// Generate OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// HTML Email Template
function getOtpHtml(otp) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333333; margin: 0;">Email Verification</h1>
                </div>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello,</p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with us. Please use the following OTP (One-Time Password) to verify your email address:
                </p>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <span style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">
                        ${otp}
                    </span>
                </div>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                    This OTP is valid for <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
                </p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                    Best regards,<br>
                    <strong>Your App Team</strong>
                </p>
            </div>
        </body>
        </html>
    `;
}

export { generateOtp, getOtpHtml };