import { Injectable, OnDestroy } from '@angular/core';
import { signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ChatMessage, ConnectedUser, SendMessagePayload } from './chat.models';



@Injectable({
  providedIn: 'root'
})
export class ChatSocketService implements OnDestroy {
	private client?: Client;
	private messagesCache = new Map<string, ChatMessage[]>();

	private conversationMessages = signal<ChatMessage[]>([]);
	readonly messagesSignal = this.conversationMessages;

	private connectionState = signal<boolean>(false);
	readonly connectionSignal = this.connectionState;

	private messageSubscription?: StompSubscription;
	private historySubscription?: StompSubscription;
	private usersSubscription?: StompSubscription;
	private activeParticipantId?: number;
	private currentUserId?: number;

	private presenceSubscription?: StompSubscription;
	private presenceCache: ConnectedUser[] = [];
	private connectedUsers = signal<ConnectedUser[]>([]); 
	readonly connectedUsersSignal = this.connectedUsers;

	connect(token: string, currentUserId: number): void {
		if (this.client?.active || this.client?.connected) {
			return;
		}

		console.log('Connecting to chat websocket...');

		this.currentUserId = currentUserId;

		this.client = new Client({
			webSocketFactory: () => this.createWebSocket(),
			reconnectDelay: 5000,
			connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
			debug: (e) => {console.log('STOMP: ' + e); }
		});

		this.client.onConnect = () => {
			this.connectionState.set(true);
			this.subscribeToQueues();
			// this.subscribeToPresence(); 
			this.requestPresence();
			if (this.activeParticipantId !== undefined) {
				this.requestHistory(this.activeParticipantId);
			}
		};

		this.client.onStompError = (frame) => {
			console.error('Broker reported ERROR: ' + frame.headers['message'], frame.body);
		};

		this.client.onWebSocketClose = () => {
			this.connectionState.set(false);
			this.cleanupSubscriptions();
			this.client = undefined;
		};

		this.client.activate();
	}

	disconnect(): void {
		if (!this.client) {
			return;
		}
		this.client.deactivate();
		this.client = undefined;
		this.cleanupSubscriptions();
		this.connectionState.set(false);
	}

	setActiveParticipant(participantId: number): void {
		this.activeParticipantId = participantId;
		if (this.connectionState()) {
			this.conversationMessages.set([]);
			this.requestHistory(participantId);
		}
	}

	sendMessage(payload: SendMessagePayload): void {
	if (!this.client || !this.client.connected) {
		throw new Error('Chat connection is not active');
	}
	this.client.publish({
		destination: '/app/chat/send',
		body: JSON.stringify(payload)
	});
	}

	private subscribeToQueues(): void {
		if (!this.client) {
			return;
		}

		this.messageSubscription?.unsubscribe();
		this.historySubscription?.unsubscribe();
		this.usersSubscription?.unsubscribe();
		this.presenceSubscription?.unsubscribe();


		this.messageSubscription = this.client.subscribe('/user/queue/messages', (message: IMessage) => {
			const payload = JSON.parse(message.body) as ChatMessage;
			this.storeIncomingMessage(payload);
		});

		this.historySubscription = this.client.subscribe('/user/queue/history', (message: IMessage) => {
			const payload = JSON.parse(message.body) as ChatMessage[];
			this.storeHistory(payload);
		});

		this.usersSubscription = this.client.subscribe('/user/queue/connected-users', (message: IMessage) => {
			const users = JSON.parse(message.body) as ConnectedUser[];
			this.storePresence(users);
		});

		this.presenceSubscription = this.client.subscribe('/topic/presence', (message: IMessage) => {
			const users = JSON.parse(message.body) as ConnectedUser[];
			this.storePresence(users);
		});
	}

	private requestHistory(participantId: number): void {
		if (!this.client || !this.client.connected) {
			return;
		}
		this.client.publish({
			destination: '/app/chat/history',
			body: JSON.stringify({ participantId })
		});
	}

	private storeHistory(history: ChatMessage[]): void {
		if (this.currentUserId === undefined || this.activeParticipantId === undefined) {
			return;
		}

		if (!history.length) {
			this.conversationMessages.set([]);
			return;
		}

		const conversationId = history[0].conversationId;
		this.messagesCache.set(conversationId, history);
		this.pushMessages(conversationId);
	}

	private storeIncomingMessage(message: ChatMessage): void {
		const cache = this.messagesCache.get(message.conversationId) ?? [];
		cache.push(message);
		this.messagesCache.set(message.conversationId, cache);

		const activeConversation = Array.from(this.messagesCache.entries())
			.find(([, msgs]) =>
				msgs.some(m =>
					(m.senderId === this.activeParticipantId || m.recipientId === this.activeParticipantId)
				)
			)
		;

		if (activeConversation?.[0] === message.conversationId) {
			this.conversationMessages.set([...cache]);
		}
	}

	private pushMessages(conversationId: string): void {
		const cached = this.messagesCache.get(conversationId) ?? [];
		this.conversationMessages.set([...cached]);
	}

	private createWebSocket(): WebSocket {
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		const url = `${protocol}://${window.location.host}/ws-chat`;
		return new WebSocket(url);
	}

	private storePresence(users: ConnectedUser[]): void {
		console.log("storePresence");
		// cache
		this.presenceCache = users;
		this.connectedUsers.set(users);
	  
		// push to the “active view”
		this.pushPresence();
	}

	private requestPresence(): void {
		if (!this.client || !this.client.connected) {
		  return;
		}
	  
		this.client.publish({
		  destination: '/app/chat/connected-users',
		  body: ''
		});
	}
	  
	private pushPresence(): void {
		console.log("pushPresence");
		// update presence signal
		this.connectedUsers.set([...this.presenceCache]);

		console.log(this.connectedUsers());
	}
	
	private cleanupSubscriptions(): void {
		this.messageSubscription?.unsubscribe();
		this.historySubscription?.unsubscribe();
		this.usersSubscription?.unsubscribe();
		this.presenceSubscription?.unsubscribe();
	  
		this.messageSubscription = undefined;
		this.historySubscription = undefined;
		this.usersSubscription = undefined;
		this.presenceSubscription = undefined;
	}


	ngOnDestroy(): void {
		this.disconnect();
	}
}
