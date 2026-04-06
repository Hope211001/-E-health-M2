import { ClientService } from './clientService';
import { Conversation, Message } from '../types/chat';

class ConversationService extends ClientService {
    async getConversations(): Promise<Conversation[]> {
        const response = await this.api.get<Conversation[]>('/conversations');
        return response.data;
    }

    async getOrCreate(data: { medecinId?: string; patientId?: string }): Promise<Conversation> {
        const response = await this.api.post<Conversation>('/conversations', data);
        return response.data;
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        const response = await this.api.get<Message[]>(`/conversations/${conversationId}/messages`);
        return response.data;
    }

    async sendMessage(conversationId: string, contenu: string): Promise<Message> {
        const response = await this.api.post<Message>(`/conversations/${conversationId}/messages`, { contenu });
        return response.data;
    }

    async markAsRead(conversationId: string): Promise<void> {
        await this.api.put(`/conversations/${conversationId}/read`);
    }
}

export const conversationService = new ConversationService();
