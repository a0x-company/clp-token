import axios from 'axios';
import { DISCORD_ALERT_WEBHOOK_URL, DISCORD_DEPOSIT_WEBHOOK_URL, DISCORD_WITHDRAWAL_WEBHOOK_URL } from '@internal/config';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  EMERGENCY = 'EMERGENCY',
}

interface NotificationConfig {
  color: number;
  emoji: string;
}

export type NotificationChannel = 'alert' | 'deposit' | 'withdrawal';

export class DiscordNotificationService {
  private alertWebhookUrl: string;
  private depositWebhookUrl: string;
  private withdrawalWebhookUrl: string;
  private notificationConfigs: Record<NotificationType, NotificationConfig> = {
    [NotificationType.INFO]: { color: 3447003, emoji: 'ℹ️' },
    [NotificationType.SUCCESS]: { color: 5763719, emoji: '✅' },
    [NotificationType.WARNING]: { color: 16776960, emoji: '⚠️' },
    [NotificationType.ERROR]: { color: 15548997, emoji: '❌' },
    [NotificationType.EMERGENCY]: { color: 15158332, emoji: '🚨' },
  };

  constructor() {
    this.alertWebhookUrl = DISCORD_ALERT_WEBHOOK_URL || '';
    this.depositWebhookUrl = DISCORD_DEPOSIT_WEBHOOK_URL || '';
    this.withdrawalWebhookUrl = DISCORD_WITHDRAWAL_WEBHOOK_URL || '';
  }

  public async sendNotification(
    message: string,
    type: NotificationType = NotificationType.INFO,
    title?: string,
    imageUrl?: string,
    channel: NotificationChannel = 'alert'
  ): Promise<void> {
    const config = this.notificationConfigs[type];
    const payload = {
      embeds: [{
        title: `${config.emoji} ${title || type}`,
        description: message,
        color: config.color,
        image: imageUrl ? { url: imageUrl } : undefined
      }]
    };

    let webhookUrl: string;
    switch (channel) {
      case 'deposit':
        webhookUrl = this.depositWebhookUrl;
        break;
      case 'withdrawal':
        webhookUrl = this.withdrawalWebhookUrl;
        break;
      default:
        webhookUrl = this.alertWebhookUrl;
    }

    try {
      await axios.post(webhookUrl, payload);
      console.log(`Discord notification sent successfully: ${type} to ${channel} channel`);
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      throw new Error('Failed to send Discord notification');
    }
  }
}