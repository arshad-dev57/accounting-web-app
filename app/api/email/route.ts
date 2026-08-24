// app/api/email/route.ts - Email API Endpoint for Frontend

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, attachments } = body;

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    // Call backend email service
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        attachments
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to send email' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
