import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, JwtResponse, User } from './auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser = this.currentUserSubject.asObservable();
  public currentUser$ = this.currentUser;
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setAuthData(response);
        this.router.navigate([this.getReturnUrl()]);
      })
    );
  }

  register(data: RegisterRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        this.setAuthData(response);
        this.router.navigate([this.getReturnUrl()]);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token') || this.currentUserValue?.token || null;
  }

  private initializeAuth(): void {
    const storedUser = this.loadStoredUser();
    const storedToken = localStorage.getItem('access_token') || storedUser?.token || null;

    if (storedUser && storedToken) {
      localStorage.setItem('access_token', storedToken);
      this.currentUserSubject.next(storedUser);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private setAuthData(response: JwtResponse): void {
    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      token: response.token
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('access_token', response.token);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private loadStoredUser(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return null;
    }

    try {
      const candidate = JSON.parse(storedUser);
      const isValidUser =
        typeof candidate?.id === 'number' &&
        typeof candidate?.username === 'string' &&
        typeof candidate?.email === 'string' &&
        typeof candidate?.token === 'string' &&
        candidate.token.length > 0;

      if (isValidUser) {
        return candidate;
      }
    } catch {
      // ignore JSON parse issues, fall through to cleanup
    }

    localStorage.removeItem('currentUser');
    return null;
  }

  private getReturnUrl(): string {
    const storedReturnUrl = sessionStorage.getItem('returnUrl');
    if (storedReturnUrl) {
      sessionStorage.removeItem('returnUrl');
      return storedReturnUrl;
    }
    return '/home';
  }
}
