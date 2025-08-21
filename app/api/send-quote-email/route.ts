import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import QuoteApprovedEmail from '../../../emails/quote-approved';
import QuoteRejectedEmail from '../../../emails/quote-rejected';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      quoteId, 
      status, 
      customerEmail, 
      customerName, 
      material, 
      quantity, 
      dimensions, 
      company,
      rejectionReason 
    } = body;

    // Validate required fields
    if (!quoteId || !status || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let emailComponent;
    let subject;
    
    if (status === 'approved') {
      emailComponent = QuoteApprovedEmail({
        customerName,
        quoteId,
        material,
        quantity,
        dimensions,
        company,
      });
      subject = `🎉 Great News! Your Quote #${quoteId} Has Been Approved`;
    } else if (status === 'rejected') {
      emailComponent = QuoteRejectedEmail({
        customerName,
        quoteId,
        material,
        quantity,
        dimensions,
        company,
        rejectionReason,
      });
      subject = `📋 Update on Your Quote #${quoteId}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@noxmetals.com',
      to: [customerEmail],
      subject: subject,
      react: emailComponent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      emailId: data?.id,
      message: `${status === 'approved' ? 'Approval' : 'Update'} email sent successfully`
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
