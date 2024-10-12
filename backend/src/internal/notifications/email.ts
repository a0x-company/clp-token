import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BurnRequestApprovedEmail, BurnRequestRejectedEmail, DepositApprovedEmail, DepositRejectedEmail, NewBurnRequestEmail, NewDepositEmail, TokensMintedEmail } from './email-templates';

export enum EmailType {
  NEW_DEPOSIT = 'NEW_DEPOSIT',
  DEPOSIT_APPROVED = 'DEPOSIT_APPROVED',
  DEPOSIT_REJECTED = 'DEPOSIT_REJECTED',
  TOKENS_MINTED = 'TOKENS_MINTED',
  NEW_BURN_REQUEST = 'NEW_BURN_REQUEST',
  BURN_REQUEST_APPROVED = 'BURN_REQUEST_APPROVED',
  BURN_REQUEST_REJECTED = 'BURN_REQUEST_REJECTED',
}

export class EmailNotificationService {
  private resend: Resend;

  constructor(resendApiKey: string) {
    this.resend = new Resend(resendApiKey);
  }

  private async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'a0x<hello@zurf.social>',
        to,
        subject,
        html: htmlContent,
      });
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  public async sendNotification(
    to: string,
    type: EmailType,
    data: any
  ): Promise<void> {
    let subject: string;
    let htmlContent: string;
  
    switch (type) {
      case EmailType.NEW_DEPOSIT:
        subject = 'New deposit registered';
        htmlContent = await render(NewDepositEmail(data));
        break;
      case EmailType.DEPOSIT_APPROVED:
        subject = 'Your deposit has been approved';
        htmlContent = await render(DepositApprovedEmail(data));
        break;
      case EmailType.DEPOSIT_REJECTED:
        subject = 'Your deposit has been rejected';
        htmlContent = await render(DepositRejectedEmail(data));
        break;
      case EmailType.TOKENS_MINTED:
        subject = 'Your tokens have been minted';
        htmlContent = await render(TokensMintedEmail(data));
        break;
      case EmailType.NEW_BURN_REQUEST:
        subject = 'New burn request registered';
        htmlContent = await render(NewBurnRequestEmail(data));
        break;
      case EmailType.BURN_REQUEST_APPROVED:
        subject = 'Your burn request has been approved';
        htmlContent = await render(BurnRequestApprovedEmail(data));
        break;
      case EmailType.BURN_REQUEST_REJECTED:
        subject = 'Your burn request has been rejected';
        htmlContent = await render(BurnRequestRejectedEmail(data));
        break;
      default:
        throw new Error('Invalid email type');
    }
  
    await this.sendEmail(to, subject, htmlContent);
  }
}