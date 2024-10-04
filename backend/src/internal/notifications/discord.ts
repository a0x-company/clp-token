import axios from 'axios';

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

export class DiscordNotificationService {
  private webhookUrl: string;
  private notificationConfigs: Record<NotificationType, NotificationConfig> = {
    [NotificationType.INFO]: { color: 3447003, emoji: 'ℹ️' },
    [NotificationType.SUCCESS]: { color: 5763719, emoji: '✅' },
    [NotificationType.WARNING]: { color: 16776960, emoji: '⚠️' },
    [NotificationType.ERROR]: { color: 15548997, emoji: '❌' },
    [NotificationType.EMERGENCY]: { color: 15158332, emoji: '🚨' },
  };

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  public async sendNotification(
    message: string,
    type: NotificationType = NotificationType.INFO,
    title?: string
  ): Promise<void> {
    const config = this.notificationConfigs[type];
    const payload = {
      embeds: [{
        title: `${config.emoji} ${title || type}`,
        description: message,
        color: config.color
      }]
    };

    try {
      await axios.post(this.webhookUrl, payload);
      console.log(`Discord notification sent successfully: ${type}`);
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      throw new Error('Failed to send Discord notification');
    }
  }
}
