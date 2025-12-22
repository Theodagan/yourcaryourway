import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatMessage, ConnectedUser, SendMessagePayload } from './chat.models';

@Injectable({ providedIn: 'root' })
export class ChatSocketService implements OnDestroy {
  private client?: Client;

  /* -------------------- Observables (RxJS owns async) -------------------- */

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectedUsersSubject = new BehaviorSubject<ConnectedUser[]>([]);
  private connectionStateSubject = new BehaviorSubject<boolean>(false);

  /* -------------------- Angular's signal (Angular owns render) -------------------- */

  readonly messagesSignal = toSignal(this.messagesSubject, { initialValue: [] });
  readonly connectedUsersSignal = toSignal(this.connectedUsersSubject, { initialValue: [] });
  readonly connectionSignal = toSignal(this.connectionStateSubject, { initialValue: false });

  /* -------------------- MISC -------------------- */

  private messagesCache = new Map<string, ChatMessage[]>();
  private currentUserId?: number;

  private messageSub?: StompSubscription;
  private historySub?: StompSubscription;
  private presenceSub?: StompSubscription;
  private usersSub?: StompSubscription;

  /* -------------------- CONNECTION -------------------- */

  connect(token: string, currentUserId: number): void {
    if (this.client?.active) return;

    this.currentUserId = currentUserId;

    this.client = new Client({
      webSocketFactory: () => this.createWebSocket(),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: msg => console.debug('STOMP:', msg)
    });

    this.client.onConnect = () => {
      this.connectionStateSubject.next(true);
      this.subscribe();
      this.requestPresence();
    };

    this.client.onWebSocketClose = () => {
      this.connectionStateSubject.next(false);
      this.cleanup();
    };

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.cleanup();
  }

  /* -------------------- SUBSCRIPTIONS -------------------- */

  private subscribe(): void {
    if (!this.client) return;

    this.messageSub = this.client.subscribe('/user/queue/messages', msg =>
      	this.handleIncomingMessage(JSON.parse(msg.body))
    );

    this.historySub = this.client.subscribe('/user/queue/history', msg =>
      	this.handleHistory(JSON.parse(msg.body))
    );

    this.usersSub = this.client.subscribe('/user/queue/connected-users', msg => {
      console.log(msg.body);
      this.connectedUsersSubject.next(JSON.parse(msg.body));
	  });

    this.presenceSub = this.client.subscribe('/topic/presence', msg => {
      console.log(msg.body, this.currentUserId);
      let body = JSON.parse(msg.body) as { id: number; username: string }[];
      let filteredUsers = body.filter(user => user.id !== this.currentUserId);
      // console.log("test", body.filter(user => user.id !== this.currentUserId));
      this.connectedUsersSubject.next(filteredUsers);
    });
  }

  /* -------------------- CHAT -------------------- */

  setActiveParticipant(id: number): void {
    this.messagesSubject.next([]);
    this.requestHistory(id);
  }

  sendMessage(payload: SendMessagePayload): void {
    this.client?.publish({
      destination: '/app/chat/send',
      body: JSON.stringify(payload)
    });
  }

  private requestHistory(participantId: number): void {
    this.client?.publish({
      destination: '/app/chat/history',
      body: JSON.stringify({ participantId })
    });
  }

  private handleHistory(history: ChatMessage[]): void {
    if (!history.length) {
      this.messagesSubject.next([]);
      return;
    }

    const id = history[0].conversationId;
    this.messagesCache.set(id, history);
    this.messagesSubject.next([...history]);
  }

  private handleIncomingMessage(message: ChatMessage): void {
    const cache = this.messagesCache.get(message.conversationId) ?? [];
    cache.push(message);
    this.messagesCache.set(message.conversationId, cache);

    this.messagesSubject.next([...cache]);
  }

  /* -------------------- PRESENCE -------------------- */

  private requestPresence(): void {
    this.client?.publish({
      destination: '/app/chat/connected-users',
      body: ''
    });
  }

  /* -------------------- UTILS -------------------- */

  private createWebSocket(): WebSocket {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return new WebSocket(`${protocol}://${location.host}/ws-chat`);
  }

  private cleanup(): void {
    this.messageSub?.unsubscribe();
    this.historySub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.usersSub?.unsubscribe();

    this.client = undefined;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}