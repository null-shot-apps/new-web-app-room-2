import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface EmailRequest {
  to: string;
  alert: {
    whale: string;
    to: string;
    amount: string;
    estimatedValue: string;
    destination: string;
    isExchange: boolean;
    timestamp: string;
    txHash: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmailRequest;
    const { to, alert } = body;

    // Create transporter (using Gmail as example - users would configure their own)
    // In production, this would use environment variables
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
      },
    });

    const isExchange = alert.isExchange;
    const subject = isExchange 
      ? '🚨 WHALE ALERT: Exchange Deposit Detected!'
      : '⚠️ WHALE ALERT: Large Transfer Detected';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isExchange ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .alert-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${isExchange ? '#dc2626' : '#f59e0b'}; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; margin-bottom: 10px; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          a { color: #2563eb; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${isExchange ? '🚨' : '⚠️'} Whale Alert</h1>
            <p style="margin: 5px 0 0 0;">${isExchange ? 'Exchange Deposit Detected' : 'Large Transfer Detected'}</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <div class="value">
                <span class="label">Whale Address:</span><br/>
                <code>${alert.whale}</code>
              </div>
              <div class="value">
                <span class="label">Amount:</span><br/>
                ${alert.amount} tokens (~${alert.estimatedValue})
              </div>
              <div class="value">
                <span class="label">Destination:</span><br/>
                ${alert.destination}
              </div>
              <div class="value">
                <span class="label">To Address:</span><br/>
                <code>${alert.to}</code>
              </div>
              <div class="value">
                <span class="label">Time:</span><br/>
                ${new Date(alert.timestamp).toLocaleString()}
              </div>
              <div class="value">
                <span class="label">Transaction:</span><br/>
                <a href="https://etherscan.io/tx/${alert.txHash}" target="_blank">View on Etherscan</a>
              </div>
            </div>

            ${isExchange ? `
              <div class="warning">
                <strong>⚠️ Action Required:</strong><br/>
                This whale has moved tokens to an exchange, which often indicates an intention to sell. 
                Consider reviewing your position and market conditions.
              </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated alert from Whale Alert System</p>
              <p>Monitor your crypto investments in real-time</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: '"Whale Alert" <noreply@whalealert.com>',
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


