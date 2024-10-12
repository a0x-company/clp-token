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

const buttonStyles = {
  backgroundColor: '#007bff',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '20px',
};

const headerImageStyles = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  maxHeight: '150px',
  objectFit: 'cover' as const,
  objectPosition: 'center' as const,
};

const HeaderImage = () => (
  <Section style={{ backgroundColor: '#f0f0f0', padding: '20px 0' }}>
    <Img
      src="https://storage.googleapis.com/clpd-assets/magnific-CLPD-cover-1200-og.png"
      alt="CLPD Header"
      style={headerImageStyles}
    />
  </Section>
);

export const NewDepositEmail = ({ amount, userName, depositId }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>We have received your deposit request and proof of payment. Thank you for choosing our tokenization service.</Text>
        <Text>Here are the details of your deposit:</Text>
        <Text><strong>Amount:</strong> ${amount}</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text>Our team will validate your deposit shortly. Once approved, we will issue your tokens at a 1:1 ratio with your deposit amount.</Text>
        <Text>We'll notify you as soon as the validation process is complete.</Text>
      </Container>
    </Body>
  </Html>
);

export const DepositApprovedEmail = ({ amount, depositId, userName }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>Great news! Your deposit has been approved and tokens have been programed to be issued:</Text>
        <Text><strong>Amount Deposited:</strong> ${amount}</Text>
        <Text><strong>Tokens Issued:</strong> {amount} (1:1 ratio)</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text>Thank you for choosing our tokenization service. Your tokens will show be available in your wallet shortly.</Text>
        <Text>If you don't recognize this transaction, please contact us immediately.</Text>
      </Container>
    </Body>
  </Html>
);

export const DepositRejectedEmail = ({ amount, depositId, reason, userName }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>We regret to inform you that your deposit for tokenization has been rejected:</Text>
        <Text><strong>Amount:</strong> ${amount}</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text><strong>Reason:</strong> {reason}</Text>
        <Text>If you have any questions or need further clarification about the tokenization process, please don't hesitate to contact our support team. We're here to help you with your deposit and token issuance.</Text>
        <Text>If you haven't attempted any deposit, please inform us immediately.</Text>
      </Container>
    </Body>
  </Html>
);

export const TokensMintedEmail = ({ amount, depositId, userName, transactionHash }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>Great news! Your tokens have been successfully minted:</Text>
        <Text><strong>Amount Minted:</strong> {amount} tokens</Text>
        <Text><strong>Deposit ID:</strong> {depositId}</Text>
        <Text><strong>Transaction Hash:</strong> {transactionHash}</Text>
        <Text>Your tokens are now available in your wallet. You can use them for various purposes within our ecosystem.</Text>
        <Text>If you have any questions about your minted tokens or how to use them, please don't hesitate to contact our support team.</Text>
        <Button href={`https://basescan.org/tx/${transactionHash}`} style={buttonStyles}>
          View Transaction on Basescan
        </Button>
      </Container>
    </Body>
  </Html>
);

export const NewBurnRequestEmail = ({ amount, userName, burnRequestId }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>We have received your redeem request.</Text>
        <Text>Here are the details of your redeem request:</Text>
        <Text><strong>Amount:</strong> {amount} tokens</Text>
        <Text><strong>Redeem Request ID:</strong> {burnRequestId}</Text>
        <Text>Our team will process your redeem request shortly. Once approved, we will initiate the token burning process and transfer the corresponding funds to your specified account.</Text>
        <Text>We'll notify you as soon as the validation process is complete.</Text>
      </Container>
    </Body>
  </Html>
);

export const BurnRequestApprovedEmail = ({ amount, burnRequestId, userName }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>Great news! Your burn request has been approved and the tokens have been burned:</Text>
        <Text><strong>Amount Burned:</strong> {amount} tokens</Text>
        <Text><strong>Burn Request ID:</strong> {burnRequestId}</Text>
        <Text>The corresponding funds will be transferred to your specified account shortly.</Text>
        <Text>Thank you for using our token burning service.</Text>
        <Text>If you don't recognize this transaction, please contact us immediately.</Text>
        <Button href="https://yourcompany.com/account" style={buttonStyles}>
          View Account
        </Button>
      </Container>
    </Body>
  </Html>
);

export const BurnRequestRejectedEmail = ({ amount, burnRequestId, reason, userName }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>We regret to inform you that your burn request has been rejected:</Text>
        <Text><strong>Amount:</strong> {amount} tokens</Text>
        <Text><strong>Burn Request ID:</strong> {burnRequestId}</Text>
        <Text><strong>Reason:</strong> {reason}</Text>
        <Text>If you have any questions or need further clarification about the token burning process, please don't hesitate to contact our support team. We're here to help you with your burn request.</Text>
        <Text>If you haven't attempted any burn request, please inform us immediately.</Text>
        <Button href="https://yourcompany.com/support" style={buttonStyles}>
          Contact Support
        </Button>
      </Container>
    </Body>
  </Html>
);

export const BurnRequestCompletedEmail = ({ amount, burnRequestId, userName, proofImageUrl }) => (
  <Html>
    <Head />
    <Body style={baseStyles}>
      <Container style={containerStyles}>
        <HeaderImage />
        <Text>Dear {userName},</Text>
        <Text>We are pleased to inform you that your redeem request has been completed successfully:</Text>
        <Text><strong>Amount Redeemed:</strong> {amount} tokens</Text>
        <Text><strong>Redeem Request ID:</strong> {burnRequestId}</Text>
        <Text>The corresponding funds have been transferred to your specified account. You can view the proof of transfer below:</Text>
        <Img src={proofImageUrl} alt="Proof of Transfer" width="100%" />
        <Text>Thank you for using our token burning service. If you have any questions or concerns, please don't hesitate to contact our support team.</Text>
      </Container>
    </Body>
  </Html>
);