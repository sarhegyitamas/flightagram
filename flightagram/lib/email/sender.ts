/**
 * Email Sender
 * Sends HTML emails via ZeptoMail API (direct HTML, not templates).
 */

import axios from 'axios';
import { emailLogger as logger } from '@/lib/logging';

interface SendHTMLEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

interface SendHTMLEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const MOCK_MODE = !process.env.ZEPTO_API_KEY;

export async function sendHTMLEmail({
  to,
  toName,
  subject,
  htmlBody,
  textBody,
}: SendHTMLEmailParams): Promise<SendHTMLEmailResult> {
  if (MOCK_MODE) {
    logger.warn('Email sender in mock mode - no ZEPTO_API_KEY configured');
    logger.info('Mock email sent', { to, subject });
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  const API_KEY = process.env.ZEPTO_API_KEY;
  const MAILAGENT_ID = process.env.ZEPTO_MAIL_AGENT_ID;

  const payload = {
    from: {
      address: 'hello@flightagram.com',
      name: 'Flightagram',
    },
    to: [
      {
        email_address: {
          address: to,
          name: toName || to,
        },
      },
    ],
    subject,
    htmlbody: htmlBody,
    textbody: textBody || '',
  };

  try {
    logger.info('Sending email', { to, subject });

    const response = await axios.post(
      'https://api.zeptomail.eu/v1.1/email',
      payload,
      {
        headers: {
          'X-MAILAGENT': MAILAGENT_ID,
          Authorization: `Zoho-enczapikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageId = response.data?.request_id || response.data?.message || String(Date.now());

    logger.info('Email sent successfully', { to, messageId });
    return { success: true, messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send email', { to, subject }, error);
    return { success: false, error: errorMsg };
  }
}
