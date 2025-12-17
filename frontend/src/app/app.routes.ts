import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { authGuard } from './auth/auth-guard';
import { ChatComponent } from './features/chat/components/chat.component';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  {path: 'home', component: Home, canActivate: [authGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
