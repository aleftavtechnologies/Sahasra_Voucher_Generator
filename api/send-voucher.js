// Vercel Serverless Function (Node.js runtime - required for SMTP, Edge runtime can't do this)
// POST /api/send-voucher
// Body: { toEmail, ccEmail?, subject, body, pdfBase64, pdfFilename }

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Basic CORS - only needed if you ever call this from a different origin than the portal itself
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Lightweight shared-secret check. Not bulletproof (it's visible in the page's
  // JS source to anyone who looks), but stops casual/automated abuse of your
  // Zoho sending quota. Set the same value in Vercel env vars and in the
  // frontend's SEND_API_KEY constant.
  const expectedKey = process.env.API_KEY;
  if (expectedKey && req.headers['x-api-key'] !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { toEmail, ccEmail, subject, body, pdfBase64, pdfFilename } = req.body || {};

  if (!toEmail || !subject || !body || !pdfBase64) {
    res.status(400).json({ error: 'Missing required fields: toEmail, subject, body, pdfBase64' });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
      port: Number(process.env.ZOHO_SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.ZOHO_SMTP_USER,
        pass: process.env.ZOHO_SMTP_PASS,
      },
    });

    const fromName = process.env.ZOHO_FROM_NAME || 'Sahasra Holidays (Pvt) Ltd';
    const fromEmail = process.env.ZOHO_FROM_EMAIL || process.env.ZOHO_SMTP_USER;
    const replyTo = process.env.ZOHO_REPLY_TO || fromEmail;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      cc: ccEmail || undefined,
      replyTo,
      subject,
      text: body,
      attachments: [
        {
          filename: pdfFilename || 'voucher.pdf',
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    });

    res.status(200).json({ sent: true });
  } catch (err) {
    console.error('send-voucher error:', err);
    res.status(500).json({ error: 'Failed to send email', detail: String(err && err.message || err) });
  }
};
