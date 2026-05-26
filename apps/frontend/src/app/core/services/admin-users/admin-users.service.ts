import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApiResponse, IAdminUserProfile, IUserResponse, ICreateUserDTO, IUpdateUserDTO, IUserDashboardStats } from '@eduno/shared';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private http = inject(HttpClient);

  /**
   * Obtiene la información detallada de un usuario y sus sesiones activas (solo para Admin/Moderador)
   */
  getUserProfile(id: string): Observable<IApiResponse<IAdminUserProfile>> {
    return this.http.get<IApiResponse<IAdminUserProfile>>(`/api/users/${id}`);
  }

  /**
   * Alterna el estado de suspensión (baneo) de un usuario (solo para Admin)
   */
  toggleBan(id: string): Observable<IApiResponse<{ isBanned: boolean }>> {
    return this.http.patch<IApiResponse<{ isBanned: boolean }>>(`/api/users/${id}/ban`, {});
  }

  /**
   * Reenvía el correo de verificación a un usuario específico (solo para Admin)
   */
  resendVerification(id: string): Observable<IApiResponse<void>> {
    return this.http.post<IApiResponse<void>>(`/api/users/${id}/resend-verification`, {});
  }

  /**
   * Cierra/revoca una sesión activa específica de un usuario (solo para Admin)
   */
  revokeSession(userId: string, sessionId: string): Observable<IApiResponse<void>> {
    return this.http.delete<IApiResponse<void>>(`/api/users/${userId}/sessions/${sessionId}`);
  }

  /**
   * Obtiene la lista filtrada de usuarios para la gestión administrativa (solo para Admin/Moderador)
   */
  getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    period?: string;
    sort?: string;
  }): Observable<IApiResponse<IUserResponse[]>> {
    return this.http.get<IApiResponse<IUserResponse[]>>('/api/users', {
      params: params as any,
    });
  }

  /**
   * Crea un nuevo usuario administrativamente (solo para Admin)
   */
  createUser(user: ICreateUserDTO): Observable<IApiResponse<IUserResponse>> {
    return this.http.post<IApiResponse<IUserResponse>>('/api/users', user);
  }

  /**
   * Actualiza la información de un usuario administrativamente (solo para Admin)
   */
  updateUser(
    id: string,
    user: IUpdateUserDTO,
  ): Observable<IApiResponse<IUserResponse>> {
    return this.http.patch<IApiResponse<IUserResponse>>(`/api/users/${id}`, user);
  }

  /**
   * Elimina un usuario administrativamente (solo para Admin)
   */
  deleteUser(id: string): Observable<IApiResponse<void>> {
    return this.http.delete<IApiResponse<void>>(`/api/users/${id}`);
  }

  /**
   * Obtiene las estadísticas generales (KPIs) de los usuarios para el dashboard administrativo
   */
  getDashboardStats(): Observable<IApiResponse<IUserDashboardStats>> {
    return this.http.get<IApiResponse<IUserDashboardStats>>('/api/users/stats');
  }
}
