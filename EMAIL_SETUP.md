# Email Setup Guide 📧

This guide explains how to set up email notifications for quote status updates in the Nox Metals application.

## Overview

The application now sends automated email notifications to users when their quote status is updated by an admin:
- ✅ **Approved quotes**: Users receive a congratulatory email with quote details
- ❌ **Rejected quotes**: Users receive an update email with quote details

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# App Configuration (if not already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Steps

### 1. Get Resend API Key

1. Sign up for a free account at [Resend](https://resend.com)
2. Verify your domain or use the development domain
3. Generate an API key from your dashboard
4. Add the API key to your environment variables

### 2. Configure From Email

- For development: Use the default Resend domain
- For production: Verify your own domain in Resend dashboard

### 3. Test the Implementation

1. Start your development server: `pnpm dev`
2. Log in as an admin user
3. Navigate to the admin dashboard
4. Update a quote status to "approved" or "rejected"
5. Check that the email is sent successfully (check console logs)

## Email Templates

The application includes two responsive email templates:

### Quote Approved Template (`emails/quote-approved.tsx`)
- Congratulatory design with green accents
- Quote details summary
- Call-to-action button to view quote
- Professional styling with Nox Metals branding

### Quote Rejected Template (`emails/quote-rejected.tsx`)
- Professional update notification
- Quote details summary
- Option to submit a new quote
- Supportive messaging with contact information

## API Route

**Endpoint**: `POST /api/send-quote-email`

**Request Body**:
```json
{
  "quoteId": "quote_id",
  "status": "approved|rejected",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "material": "aluminum",
  "quantity": 10,
  "dimensions": "12\" × 8\" × 4\"",
  "company": "Acme Corp",
  "rejectionReason": "Optional reason for rejection"
}
```

**Response**:
```json
{
  "success": true,
  "emailId": "email_id_from_resend",
  "message": "Email sent successfully"
}
```

## Integration Details

The email functionality is automatically triggered when an admin updates a quote status in the admin dashboard. The system:

1. Updates the quote status in the database
2. Sends an appropriate email notification to the user
3. Updates the UI to reflect the changes
4. Continues operation even if email sending fails (graceful degradation)

## Mobile Responsive Design

Both email templates are fully responsive and optimized for:
- 📱 Mobile devices
- 📱 Tablet displays
- 💻 Desktop email clients
- 🌙 Dark mode support (where applicable)

## Troubleshooting

### Common Issues

1. **Email not sending**: Check your Resend API key and console logs
2. **Template not rendering**: Ensure all required props are provided
3. **Environment variables**: Make sure all required env vars are set

### Development Tips

- Test emails in development using Resend's preview feature
- Use the Resend dashboard to monitor email delivery
- Check browser console for any API errors

## Security Notes

- API key is server-side only (not exposed to client)
- Email sending failures don't block quote status updates
- Input validation prevents malicious email content
- Rate limiting should be added for production use

