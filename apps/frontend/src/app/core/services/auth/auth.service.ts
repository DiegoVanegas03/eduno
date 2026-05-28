import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize, map, shareReplay } from 'rxjs';
import { toast } from 'ngx-sonner';
import {
  UserRole,
  IUserResponse as User,
  USER_ROLES,
  IAuthResponse,
  getInitialLetter,
  IApiResponse,
} from '@eduno/shared';
import { environment } from '@env/environment';

export { USER_ROLES };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = toast;

  private _currentUser = signal<User | null>(null);
  private _currentSessionId = signal<string | null>(null);

  currentUser = this._currentUser.asReadonly();
  currentSessionId = this._currentSessionId.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);
  userRole = computed(() => this._currentUser()?.role || null);

  private initialCheck$: Observable<User | null>;

  constructor() {
    this.initialCheck$ = this.checkSession().pipe(shareReplay(1));
    // Trigger initial session check immediately
    this.initialCheck$.subscribe();
  }

  waitForAuth(): Observable<User | null> {
    return this.initialCheck$;
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  checkSession(): Observable<User | null> {
    return this.http.get<IApiResponse<void> | IAuthResponse>('/auth/get-session').pipe(
      tap((res) => {
        if (res && 'session' in res) {
          this._currentSessionId.set(res.session?.id ?? null);
        } else if (res && 'success' in res) {
          if (!res.success && res.message) {
            this.toast.error(res.message);
          }
        }
      }),
      map((res) => {
        if (!res || !('user' in res) || !res.user) return null;
        return { ...res.user, initialLetter: getInitialLetter(res.user.name) };
      }),
      tap((user) => this._currentUser.set(user)),
      catchError(() => {
        this._currentUser.set(null);
        this._currentSessionId.set(null);
        return of(null);
      }),
    );
  }

  login(email: string, password: string): Observable<User | null> {
    return this.http
      .post<IApiResponse<void> | IAuthResponse>('/auth/sign-in/email', { email, password })
      .pipe(
        map((res) => {
          if (!res || !('user' in res) || !res.user) return null;
          return { ...res.user, initialLetter: getInitialLetter(res.user.name) };
        }),
        tap((user) => {
          if (user) {
            this._currentUser.set(user);
            this.toast.success(`Bienvenido de nuevo, ${user.name}`);
          } else {
            this.toast.error('Error al iniciar sesión');
          }
        }),
        catchError((err) => {
          this.toast.error(err.error?.message || 'Error al iniciar sesión');
          throw err;
        }),
      );
  }

  register(name: string, email: string, password: string): Observable<User | null> {
    return this.http
      .post<IApiResponse<void> | IAuthResponse>('/auth/sign-up/email', { name, email, password })
      .pipe(
        map((res) => {
          if (!res || !('user' in res) || !res.user) return null;
          return { ...res.user, initialLetter: getInitialLetter(res.user.name) };
        }),
        tap((user) => {
          if (user) {
            this._currentUser.set(user);
            this.toast.success('Tu cuenta ha sido creada exitosamente. ¡Bienvenido!');
          }
        }),
        catchError((err) => {
          this.toast.error(err.error?.message || 'Error al registrarse');
          throw err;
        }),
      );
  }

  refreshToken(): Observable<User> {
    return this.checkSession().pipe(
      map((user) => {
        if (!user) {
          throw new Error('No session available');
        }
        return user;
      }),
    );
  }

  listAccounts(): Observable<{ provider: string; id: string; accountId: string }[]> {
    return this.http.get<{ provider: string; id: string; accountId: string }[]>(
      '/auth/list-accounts',
    );
  }

  logout(): void {
    this.http
      .post('/auth/sign-out', {})
      .pipe(
        finalize(() => {
          this._currentUser.set(null);
          this.router.navigate(['/auth/login']);
          this.toast.info('Sesión cerrada correctamente');
        }),
      )
      .subscribe();
  }

  socialLogin(provider: 'google' | 'microsoft'): void {
    const callbackUrl = window.location.origin + '/';
    window.location.href = `${environment.apiUrl}/auth/sign-in/social?provider=${provider}&callbackURL=${callbackUrl}`;
  }

  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }
}
