import { Resend } from 'resend';
import { render } from '@react-email/render';
import { DepositApprovedEmail, DepositRejectedEmail, NewDepositEmail } from './email-templates';

export enum EmailType {
  NEW_DEPOSIT = 'NEW_DEPOSIT',
  DEPOSIT_APPROVED = 'DEPOSIT_APPROVED',
  DEPOSIT_REJECTED = 'DEPOSIT_REJECTED',
}

export class EmailNotificationService {
  private resend: Resend;

  constructor(resendApiKey: string) {
    this.resend = new Resend(resendApiKey);
  }

  private async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'noreply@tudominio.com',
        to,
        subject,
        html: htmlContent,
      });
      console.log(`Correo electrónico enviado con éxito a ${to}`);
    } catch (error) {
      console.error('Error al enviar correo electrónico:', error);
      throw new Error('No se pudo enviar el correo electrónico');
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
        subject = 'Nuevo depósito registrado';
        htmlContent = render(NewDepositEmail(data));
        break;
      case EmailType.DEPOSIT_APPROVED:
        subject = 'Tu depósito ha sido aprobado';
        htmlContent = render(DepositApprovedEmail(data));
        break;
      case EmailType.DEPOSIT_REJECTED:
        subject = 'Tu depósito ha sido rechazado';
        htmlContent = render(DepositRejectedEmail(data));
        break;
      default:
        throw new Error('Tipo de correo electrónico no válido');
    }

    await this.sendEmail(to, subject, htmlContent);
  }
}