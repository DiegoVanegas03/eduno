import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IApiResponse } from '@eduno/shared';

/**
 * Represents a single active session as returned by Better Auth.
 * Docs: https://www.better-auth.com/docs/concepts/session-management
 */
export interface BetterAuthSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Normalized session model for the UI layer.
 * Maps the raw Better Auth fields to display-friendly fields.
 */
export interface ActiveSession {
  id: string;
  token: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  icon: 'desktop' | 'mobile';
}

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private http = inject(HttpClient);

  /**
   * GET /api/auth/list-sessions
   * Better Auth exposes this endpoint automatically to list all active sessions
   * for the currently authenticated user (identified via the session cookie).
   */
  listSessions(): Observable<BetterAuthSession[]> {
    return this.http.get<IApiResponse<BetterAuthSession[]>>('/users/sessions/list').pipe(
      map((res) => res.data || [])
    );
  }

  /**
   * DELETE /api/users/sessions/:sessionId
   * Revokes a single session securely by its token/id.
   * @param token - The session token to revoke.
   */
  revokeSession(token: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/users/sessions/${token}`);
  }

  /**
   * POST /api/auth/revoke-other-sessions
   * Revokes all sessions except the current one.
   */
  revokeOtherSessions(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/auth/revoke-other-sessions', {});
  }

  /**
   * PATCH /api/users/password
   * Sends { currentPassword, newPassword, confirmPassword } to the backend.
   * The backend validates with Better Auth and returns { success, message }.
   */
  updatePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<{ success: boolean; message?: string }> {
    return this.http.patch<{ success: boolean; message?: string }>('/users/password', payload);
  }

  /**
   * DELETE /api/users/account
   * Permanently deletes the authenticated user's account.
   * Requires the user's current password as confirmation.
   * Better Auth removes the account and all associated sessions.
   */
  deleteAccount(password: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>('/users/account', {
      body: { password },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Normalizes a raw Better Auth session into a UI-ready ActiveSession object.
   * Parses the userAgent string to extract browser and device type, and
   * determines whether the session is the current one by comparing session IDs
   * (Better Auth's get-session exposes the id, not the token).
   */
  normalize(
    session: BetterAuthSession,
    currentSessionId: string | null
  ): ActiveSession {
    const ua = session.userAgent ?? '';

    return {
      id: session.id,
      token: session.token,
      device: this.parseDevice(ua),
      browser: this.parseBrowser(ua),
      location: '—',           // Better Auth no provee geolocalización por defecto
      ip: session.ipAddress ?? '—',
      lastActive: this.formatDate(session.updatedAt),
      isCurrent: session.id === currentSessionId,
      icon: this.isMobile(ua) ? 'mobile' : 'desktop',
    };
  }

  // ─── Private parsing helpers ───────────────────────────────────────────────

  private parseBrowser(ua: string): string {
    if (/Edg\//i.test(ua))     return 'Microsoft Edge';
    if (/OPR\//i.test(ua))     return 'Opera';
    if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
    if (/Chrome\//i.test(ua))  return 'Google Chrome';
    if (/Safari\//i.test(ua))  return 'Safari';
    return 'Navegador desconocido';
  }

  private parseDevice(ua: string): string {
    if (/iPhone/i.test(ua))  return 'iPhone';
    if (/iPad/i.test(ua))    return 'iPad';
    if (/Android/i.test(ua)) return 'Dispositivo Android';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Mac OS/i.test(ua))  return 'Mac';
    if (/Linux/i.test(ua))   return 'Linux PC';
    return 'Dispositivo desconocido';
  }

  private isMobile(ua: string): boolean {
    return /Mobi|Android|iPhone|iPad/i.test(ua);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now  = new Date();
    const diffMs   = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHrs  = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 2)   return 'Activo ahora';
    if (diffMins < 60)  return `Hace ${diffMins} minutos`;
    if (diffHrs  < 24)  return `Hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
    if (diffDays < 30)  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
