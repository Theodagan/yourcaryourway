import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { authGuard } from './auth/auth-guard';
import { ChatComponent } from './chat/chat.component';
import { Home } from './core/home/home';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  {path: 'home', component: Home, canActivate: [authGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
