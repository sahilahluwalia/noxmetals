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

interface MultilineRFQApprovedEmailProps {
  customerName: string;
  rfqId: string;
  company: string;
  totalItems: number;
  totalPieces: number;
  dfarsRequired?: boolean;
  rohsCompliant?: boolean;
}

export default function MultilineRFQApprovedEmail({
  customerName = 'John Doe',
  rfqId = 'RFQ12345',
  company = 'Acme Corp',
  totalItems = 3,
  totalPieces = 25,
  dfarsRequired = false,
  rohsCompliant = false,
}: MultilineRFQApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🚀 Great news! Your multi-line RFQ #{rfqId} has been approved by Nox Metals</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logo}>🏭 Nox Metals</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Multi-Line RFQ Approved! 🚀</Heading>
            
            <Text style={text}>
              Hello {customerName},
            </Text>
            
            <Text style={text}>
              Excellent news! Your multi-line RFQ request has been <strong>approved</strong> by our team at Nox Metals.
            </Text>
            
            <Section style={rfqDetails}>
              <Heading style={h2}>RFQ Summary</Heading>
              <Hr style={hr} />
              
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>RFQ ID:</Text>
                  <Text style={detailValue}>#{rfqId}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Company:</Text>
                  <Text style={detailValue}>{company}</Text>
                </Column>
              </Row>
              
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Total Items:</Text>
                  <Text style={detailValue}>{totalItems} unique items</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Total Pieces:</Text>
                  <Text style={detailValue}>{totalPieces} pieces</Text>
                </Column>
              </Row>
              
              {(dfarsRequired || rohsCompliant) && (
                <Row>
                  <Column style={{...detailColumn, width: '100%'}}>
                    <Text style={detailLabel}>Compliance Requirements:</Text>
                    <div style={complianceSection}>
                      {dfarsRequired && (
                        <Text style={complianceBadge}>🛡️ DFARS Required</Text>
                      )}
                      {rohsCompliant && (
                        <Text style={complianceBadge}>♻️ RoHS Compliant</Text>
                      )}
                    </div>
                  </Column>
                </Row>
              )}
            </Section>
            
            <Section style={highlightSection}>
              <Text style={highlightText}>
                🎯 <strong>What's Next?</strong>
              </Text>
              <Text style={text}>
                Our manufacturing team will now begin processing your multi-line RFQ. You'll receive:
              </Text>
              <ul style={bulletList}>
                <li>Detailed pricing for each item in your RFQ</li>
                <li>Production timeline and delivery schedule</li>
                <li>Material certifications and compliance documentation</li>
                <li>Direct contact with your assigned project manager</li>
              </ul>
            </Section>
            
            <Section style={ctaSection}>
              <Text style={text}>
                Our team will be in touch with you shortly to discuss the next steps and finalize the details of your order.
              </Text>
              
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
                View RFQ Dashboard
              </Button>
            </Section>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              Thank you for choosing Nox Metals for your multi-item manufacturing needs. Our team is committed 
              to delivering high-quality results for your project.
            </Text>
            
            <Text style={footer}>
              Best regards,<br />
              The Nox Metals Manufacturing Team
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

const rfqDetails = {
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

const complianceSection = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const,
};

const complianceBadge = {
  backgroundColor: '#ddd6fe',
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '600',
  padding: '4px 8px',
  borderRadius: '12px',
  margin: '0 4px 4px 0',
  display: 'inline-block',
};

const highlightSection = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const highlightText = {
  color: '#0c4a6e',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const bulletList = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  paddingLeft: '20px',
  margin: '0 0 16px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#8b5cf6',
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
