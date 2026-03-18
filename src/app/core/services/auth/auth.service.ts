import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize } from 'rxjs';

export const Roles = {
  INVITADO: 'invitado',
  ALUMNO: 'alumno',
  ADMINISTRADOR: 'administrador',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Private signal for internal state
  private _currentUser = signal<User | null>(null);

  // Exposed read-only signal
  currentUser = this._currentUser.asReadonly();

  // Computed properties
  isLoggedIn = computed(() => this._currentUser() !== null);
  userRole = computed(() => this._currentUser()?.role || null);

  constructor() {
    // Check session on initialization
    this.checkSession().subscribe();
  }

  /**
   * Restores user session from cookies.
   * Should be called on app load.
   */
  checkSession(): Observable<User | null> {
    return this.http.get<User>('/auth/me').pipe(
      tap((user) => this._currentUser.set(user)),
      catchError(() => {
        this._currentUser.set(null);
        return of(null);
      }),
    );
  }

  /**
   * Performs login and sets user state.
   * Cookies are handled by the browser/backend.
   */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<User>('/auth/login', { email, password })
      .pipe(tap((user) => this._currentUser.set(user)));
  }

  /**
   * Refreshes the session using the Refresh Token cookie.
   */
  refreshToken(): Observable<any> {
    return this.http
      .post('/auth/refresh', {})
      .pipe(tap(() => console.log('Token refreshed successfully')));
  }

  /**
   * Clears user state and notifies backend to clear cookies.
   */
  logout(): void {
    this.http
      .post('/auth/logout', {})
      .pipe(
        finalize(() => {
          this._currentUser.set(null);
          this.router.navigate(['/auth/login']);
        }),
      )
      .subscribe();
  }

  // Helper role checks
  hasRole(role: Role): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }
}
