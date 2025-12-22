import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/auth-service';
import { User } from '../../../../auth/auth.models';
import { ChatSocketService } from '../../chat-socket-service';
import { ChatMessage } from '../../chat.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  conversationForm: FormGroup;
  messageForm: FormGroup;
  messages!: Signal<ChatMessage[]>;
  connectionStatus!: Signal<boolean>;
  // connectionStatus = signal<'connected' | 'disconnected'>('disconnected');
  activeParticipantId?: number;
  currentUser?: User | null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private chatSocketService: ChatSocketService
  ) {
    this.conversationForm = this.fb.group({
      participantId: ['', [Validators.required]]
    });
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.chatSocketService.connect(this.currentUser.token, this.currentUser.id);

    this.messages = this.chatSocketService.messagesSignal;
    this.connectionStatus = this.chatSocketService.connectionSignal;
  }

  connect(): void {
    if (this.currentUser) {
      this.chatSocketService.connect(this.currentUser.token, this.currentUser.id);
    }
  }

  ngOnDestroy(): void {
    this.chatSocketService.disconnect();
  }

  startConversation(): void {
    this.errorMessage = '';
    if (this.conversationForm.invalid) {
      return;
    }

    const participantId = Number(this.conversationForm.value.participantId);
    if (Number.isNaN(participantId)) {
      this.errorMessage = 'Participant id must be a number';
      return;
    }

    this.activeParticipantId = participantId;
    this.chatSocketService.setActiveParticipant(participantId);
  }

  sendMessage(): void {
    if (!this.activeParticipantId) {
      this.errorMessage = 'Select a participant before sending messages';
      return;
    }

    if (this.messageForm.invalid) {
      return;
    }

    const payload = {
      recipientId: this.activeParticipantId,
      content: this.messageForm.value.content
    };

    try {
      this.chatSocketService.sendMessage(payload);
      this.messageForm.reset();
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Unable to send message. Please reconnect.';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isOwnMessage(message: ChatMessage): boolean {
    return !!this.currentUser && message.senderId === this.currentUser.id;
  }
}
