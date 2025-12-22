export interface ChatMessage {
  id: number;
  senderId: number;
  recipientId: number;
  senderUsername: string;
  recipientUsername: string;
  conversationId: string;
  content: string;
  sentAt: string;
}

export interface SendMessagePayload {
  recipientId: number;
  content: string;
}
