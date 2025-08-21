import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Button,
  Column,
  Row,
} from '@react-email/components';

interface QuoteRejectedEmailProps {
  customerName: string;
  quoteId: string;
  material: string;
  quantity: number;
  dimensions: string;
  company: string;
  rejectionReason?: string;
}

export default function QuoteRejectedEmail({
  customerName = 'John Doe',
  quoteId = 'Q12345',
  material = 'Aluminum',
  quantity = 10,
  dimensions = '12" × 8" × 4"',
  company = 'Acme Corp',
  rejectionReason,
}: QuoteRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your quote #{quoteId} from Nox Metals</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logo}>🏭 Nox Metals</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Quote Update 📋</Heading>
            
            <Text style={text}>
              Hello {customerName},
            </Text>
            
            <Text style={text}>
              Thank you for your interest in Nox Metals. After careful review, we regret to inform you that 
              we are unable to proceed with your quote request at this time.
            </Text>
            
            <Section style={quoteDetails}>
              <Heading style={h2}>Quote Details</Heading>
              <Hr style={hr} />
              
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Quote ID:</Text>
                  <Text style={detailValue}>#{quoteId}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Company:</Text>
                  <Text style={detailValue}>{company}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Material:</Text>
                  <Text style={detailValue}>{material}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Quantity:</Text>
                  <Text style={detailValue}>{quantity} pieces</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={{...detailColumn, width: '100%'}}>
                  <Text style={detailLabel}>Dimensions:</Text>
                  <Text style={detailValue}>{dimensions}</Text>
                </Column>
              </Row>
              
              {rejectionReason && (
                <Row>
                  <Column style={{...detailColumn, width: '100%'}}>
                    <Text style={detailLabel}>Reason:</Text>
                    <Text style={rejectionText}>{rejectionReason}</Text>
                  </Column>
                </Row>
              )}
            </Section>
            
            <Section style={ctaSection}>
              <Text style={text}>
                We appreciate your interest in our services. Please feel free to submit a new quote 
                request with different specifications, or contact us directly to discuss alternatives.
              </Text>
              
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submit-quote`}>
                Submit New Quote
              </Button>
            </Section>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              If you have any questions about this decision or would like to discuss alternative 
              solutions, please don't hesitate to contact our team.
            </Text>
            
            <Text style={footer}>
              Best regards,<br />
              The Nox Metals Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoSection = {
  padding: '32px 40px',
  borderBottom: '1px solid #f0f0f0',
};

const logo = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#374151',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const quoteDetails = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailColumn = {
  width: '50%',
  paddingRight: '12px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const rejectionText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
  margin: '16px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
};

