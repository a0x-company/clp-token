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
        <Text>Dear Administrator,</Text>
        <Text>A new deposit has been registered with the following details:</Text>
        <Text><strong>Amount:</strong> ${amount}</Text>
        <Text><strong>User:</strong> {userName}</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Button href="https://yourcompany.com/admin/deposits" style={buttonStyles}>
          Review Deposit
        </Button>
      </Container>
    </Body>
  </Html>
);

export const DepositApprovedEmail = ({ amount, depositId }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <Section style={headerStyles}>
          <Img src="https://yourcompany.com/logo.png" alt="Company Logo" width="150" height="50" />
        </Section>
        <Text>Dear Valued Customer,</Text>
        <Text>Great news! Your deposit has been approved:</Text>
        <Text><strong>Amount:</strong> ${amount}</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text>Thank you for choosing our services. Your funds are now available in your account.</Text>
        <Button href="https://yourcompany.com/account" style={buttonStyles}>
          View Account
        </Button>
      </Container>
    </Body>
  </Html>
);

export const DepositRejectedEmail = ({ amount, depositId, reason }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <Section style={headerStyles}>
          <Img src="https://yourcompany.com/logo.png" alt="Company Logo" width="150" height="50" />
        </Section>
        <Text>Dear Valued Customer,</Text>
        <Text>We regret to inform you that your deposit has been rejected:</Text>
        <Text><strong>Amount:</strong> ${amount}</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text><strong>Reason:</strong> {reason}</Text>
        <Text>If you have any questions or need further clarification, please don't hesitate to contact our support team.</Text>
        <Button href="https://yourcompany.com/support" style={buttonStyles}>
          Contact Support
        </Button>
      </Container>
    </Body>
  </Html>
);