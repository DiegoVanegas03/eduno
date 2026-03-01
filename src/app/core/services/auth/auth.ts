import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, tap, map } from 'rxjs';
import { Router } from '@angular/router';

export const Roles = {
  ESTUDIANTE: 'estuadiante',
  PROFESOR: 'profesor',
  ADMIN: 'admin',
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
  // Signal holds the current user state, null if logged out
  currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    // We could hydrate state from localStorage here if needed
  }

  // Helper selectors
  get isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  get userRole(): Role | null {
    return this.currentUser()?.role || null;
  }

  hasRole(role: Role): boolean {
    return this.userRole === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.includes(this.userRole as Role);
  }

  // Mock Login API Call
  login(
    username: string,
    pass: string,
  ): Observable<{ success: boolean; user?: User; error?: string }> {
    // Simulamos una latencia de red de 1.5s
    return of(null)
      .pipe(
        delay(1500),
        tap(() => {
          // Validación hardcodeada
          if (username === 'diego' && pass === '123') {
            const mockUser: User = {
              id: 'u_1',
              name: 'Diego Vanegas',
              username: 'diego',
              role: Roles.ADMIN, // Podemos cambiarlo aquí a PROFESOR o ADMIN
            };
            this.currentUser.set(mockUser);
          } else {
            throw new Error('Credenciales incorrectas');
          }
        }),
      )
      .pipe(
        // Mapeamos a un objeto de respuesta amigable
        map(() => ({ success: true, user: this.currentUser()! })),
      );
  }

  logout(): void {
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
