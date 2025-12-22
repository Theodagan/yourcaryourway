import { Component, output } from '@angular/core';
import { Signal } from '@angular/core';
import { ConnectedUser } from '../../../chat.models';
import { ChatSocketService } from '../../../chat-socket-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connected-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connected-users.html',
  styleUrl: './connected-users.css',
})
export class ConnectedUsers {
    users!: Signal<ConnectedUser[]>;
    recipient = output<number>();

    constructor(
        private chatSocket: ChatSocketService,
    ) {
        this.users = this.chatSocket.connectedUsersSignal;
    }
}
