import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize, map } from 'rxjs';
import { ToastService } from '@shared/services/toast/toast.service';
import { UserRole, IUserResponse as User, USER_ROLES } from '@eduno/shared';
import { environment } from '@env/environment';


export { USER_ROLES };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

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
   * Calls better-auth's built-in GET /api/auth/get-session.
   */
  checkSession(): Observable<User | null> {
    return this.http
      .get<{ session: unknown; user: User }>('/auth/get-session')
      .pipe(
        map((res) => {
          if (!res?.user) return null;
          // Derive initialLetter on the client — no need for the server to send it
          return { ...res.user, initialLetter: res.user.name.charAt(0).toUpperCase() };
        }),
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
      .post<{ user: User }>('/auth/sign-in/email', { email, password })
      .pipe(
        map((res) => res.user),
        tap((user) => {
          this._currentUser.set(user);
          this.toastService.success(`Bienvenido de nuevo, ${user.name}`);
        }),
        catchError((err) => {
          this.toastService.error(err.error?.message || 'Error al iniciar sesión');
          throw err;
        }),
      );
  }

  /**
   * Performs registration and sets user state.
   * Cookies are handled by the browser/backend.
   */
  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<{ user: User }>('/auth/sign-up/email', {
        name,
        email,
        password,
      })
      .pipe(
        map((res) => res.user),
        tap((user) => {
          this._currentUser.set(user);
          this.toastService.success('Tu cuenta ha sido creada exitosamente. ¡Bienvenido!');
        }),
        catchError((err) => {
          this.toastService.error(err.error?.message || 'Error al registrarse');
          throw err;
        }),
      );
  }

  /**
   * Refreshes the session.
   * with better-auth, this is handled automatically via cookies.
   */
  refreshToken(): Observable<any> {
    return this.checkSession();
  }

  /**
   * Clears user state and notifies backend to clear cookies.
   */
  logout(): void {
    this.http
      .post('/auth/sign-out', {})
      .pipe(
        finalize(() => {
          this._currentUser.set(null);
          this.router.navigate(['/auth/login']);
          this.toastService.info('Sesión cerrada correctamente');
        }),
      )
      .subscribe();
  }

  /**
   * Redirects the user to the social login provider.
   * better-auth handles the handshake and redirects back.
   */
  socialLogin(provider: 'google' | 'microsoft'): void {
    const callbackUrl = window.location.origin + '/';
    window.location.href = `${environment.apiUrl}/auth/sign-in/social?provider=${provider}&callbackURL=${callbackUrl}`;
  }

  // Helper role checks
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }
}
