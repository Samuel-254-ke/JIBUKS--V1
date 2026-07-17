import dotenv from 'dotenv';

dotenv.config();

const SMS_API_URL = 'https://isms.celcomafrica.com/api/services/sendsms/';
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_PARTNER_ID = process.env.SMS_PARTNER_ID;
const SMS_SHORTCODE = process.env.SMS_SHORTCODE || 'TEXTME';

export const sendSMS = async ({ mobile, message }) => {
    if (!SMS_API_KEY || !SMS_PARTNER_ID) {
        throw new Error('SMS_API_KEY and SMS_PARTNER_ID environment variables are required to send SMS.');
    }

    try {
        const payload = {
            apikey: SMS_API_KEY,
            partnerID: SMS_PARTNER_ID,
            message: message,
            shortcode: SMS_SHORTCODE,
            mobile: mobile,
            pass_type: 'plain'
        };

        const response = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Check if the response indicates success
        if (data.responses && data.responses[0] && data.responses[0]['response-code'] === 200) {
            return { success: true, messageId: data.responses[0].messageid };
        } else {
            const errorCode = data.responses?.[0]?.['response-code'] || 'unknown';
            const errorDesc = data.responses?.[0]?.['response-description'] || 'Unknown error';
            throw new Error(`SMS failed: ${errorCode} - ${errorDesc}`);
        }
    } catch (error) {
        console.error('Error sending SMS:', error.message);
        throw error;
    }
};

export const sendOtpSMS = async (mobile, otp) => {
    const message = `Your JIBUKS verification code is: ${otp}. This code expires in 15 minutes.`;
    return await sendSMS({ mobile, message });
};
