import { Component } from '@angular/core';
import { ConnectedUsers } from "../chat/components/connected-users/connected-users/connected-users";

@Component({
  selector: 'app-home',
  imports: [ConnectedUsers],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
