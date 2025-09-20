import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async scheduleDailyReminder(hour: number = 19): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Health check-in',
        body: 'Log today\'s symptoms and well-being.',
      },
      trigger: {
        hour,
        minute: 0,
        repeats: true,
      } as any,
    });
  }

  async sendRiskAlert(risk: 'low' | 'medium' | 'high'): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: risk === 'high' ? 'High risk detected' : 'Health update',
        body: risk === 'high' ? 'Please review your recommendations.' : 'Your assessment has been updated.'
      },
      trigger: null
    });
  }
}

export const notificationService = new NotificationService();


