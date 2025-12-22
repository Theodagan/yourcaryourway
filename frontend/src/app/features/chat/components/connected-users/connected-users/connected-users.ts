import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../auth/auth-service';
import { User } from '../../../../../auth/auth.models';
import { ChatSocketService } from '../../../chat-socket-service';

@Component({
	selector: 'app-connected-users',
	imports: [],
	templateUrl: './connected-users.html',
	styleUrl: './connected-users.css',
})
export class ConnectedUsers implements OnInit{

    currentUser?: User | null;

    constructor(
        private router: Router,
        private authService: AuthService,
        private chatSocketService: ChatSocketService
    ) {}

    ngOnInit(): void {
        this.currentUser = this.authService.currentUserValue;
        if (!this.currentUser) {
          this.router.navigate(['/login']);
          return;
        }
    
        this.chatSocketService.connect(this.currentUser.token, this.currentUser.id);
        this.chatSocketService.getConnectedUsers();
    }
}
