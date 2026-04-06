import { ClientService } from './clientService';

class NotificationService extends ClientService {
    async getNotifications(): Promise<any[]> {
        const response = await this.api.get('/notifications');
        return response.data;
    }

    async getUnreadCount(): Promise<number> {
        const response = await this.api.get<{ count: number }>('/notifications/unread-count');
        return response.data.count;
    }

    async markAsRead(notificationId: string): Promise<void> {
        await this.api.put(`/notifications/${notificationId}/read`);
    }

    async markAllAsRead(): Promise<void> {
        await this.api.put('/notifications/read-all');
    }
}

export const notificationService = new NotificationService();
