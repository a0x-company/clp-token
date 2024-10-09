import { Html, Head, Body, Container, Text, Link, Button, Section, Img } from '@react-email/components';
import * as React from 'react';

const baseStyles = {
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#f4f4f4',
  padding: '20px',
};

const containerStyles = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const headerStyles = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const buttonStyles = {
  backgroundColor: '#007bff',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '20px',
};


export const NewDepositEmail = ({ amount, userName, depositId }) => (
    <Html>
      <Head />
      <Body style={baseStyles}>
        <Container style={containerStyles}>
          <Section style={headerStyles}>
            <Img src="https://yourcompany.com/logo.png" alt="Company Logo" width="150" height="50" />
          </Section>
          <Text>Dear {userName},</Text>
          <Text>We have received your deposit request and proof of payment. Thank you for choosing our tokenization service.</Text>
          <Text>Here are the details of your deposit:</Text>
          <Text><strong>Amount:</strong> ${amount}</Text>
          <Text><strong>Deposit ID:</strong> {depositId}</Text>
          <Text>Our team will validate your deposit shortly. Once approved, we will issue your tokens at a 1:1 ratio with your deposit amount.</Text>
          <Text>We'll notify you as soon as the validation process is complete.</Text>
          <Button href="https://yourcompany.com/account/deposits" style={buttonStyles}>
            Track Deposit Status
          </Button>
        </Container>
      </Body>
    </Html>
  );

  export const DepositApprovedEmail = ({ amount, depositId, userName }) => (
    <Html>
      <Head />
      <Body style={baseStyles}>
        <Container style={containerStyles}>
          <Section style={headerStyles}>
            <Img src="https://yourcompany.com/logo.png" alt="Company Logo" width="150" height="50" />
          </Section>
          <Text>Dear {userName},</Text>
          <Text>Great news! Your deposit has been approved and tokens have been programed to be issued:</Text>
          <Text><strong>Amount Deposited:</strong> ${amount}</Text>
          <Text><strong>Tokens Issued:</strong> {amount} (1:1 ratio)</Text>
          <Text><strong>Deposit ID:</strong> {depositId}</Text>
          <Text>Thank you for choosing our tokenization service. Your tokens will show be available in your wallet shortly.</Text>
          <Text>If you don't recognize this transaction, please contact us immediately.</Text>
          <Button href="https://yourcompany.com/account" style={buttonStyles}>
            View Wallet
          </Button>
        </Container>
      </Body>
    </Html>
  );
  
  export const DepositRejectedEmail = ({ amount, depositId, reason, userName }) => (
    <Html>
      <Head />
      <Body style={baseStyles}>
        <Container style={containerStyles}>
          <Section style={headerStyles}>
            <Img src="https://yourcompany.com/logo.png" alt="Company Logo" width="150" height="50" />
          </Section>
          <Text>Dear {userName},</Text>
          <Text>We regret to inform you that your deposit for tokenization has been rejected:</Text>
          <Text><strong>Amount:</strong> ${amount}</Text>
          <Text><strong>Deposit ID:</strong> {depositId}</Text>
          <Text><strong>Reason:</strong> {reason}</Text>
          <Text>If you have any questions or need further clarification about the tokenization process, please don't hesitate to contact our support team. We're here to help you with your deposit and token issuance.</Text>
          <Text>If you haven't attempted any deposit, please inform us immediately.</Text>
          <Button href="https://yourcompany.com/support" style={buttonStyles}>
            Contact Support
          </Button>
        </Container>
      </Body>
    </Html>
  );