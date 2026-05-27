import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IApiResponse,
  IPaginatedResponse,
  IProfessor,
  ICreateProfessorDTO,
  IUpdateProfessorDTO,
  ISchedule,
} from '@eduno/shared';

@Injectable({
  providedIn: 'root',
})
export class ProfessorAdminService {
  private http = inject(HttpClient);

  getProfessors(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<IPaginatedResponse<IProfessor[]>> {
    return this.http.get<IPaginatedResponse<IProfessor[]>>('/api/professors', {
      params: params as any,
    });
  }

  getProfessorById(id: string): Observable<IApiResponse<IProfessor & { schedules: ISchedule[] }>> {
    return this.http.get<IApiResponse<IProfessor & { schedules: ISchedule[] }>>(`/api/professors/${id}`);
  }

  requestTeacherVerification(formData: FormData): Observable<IApiResponse<any>> {
    return this.http.post<IApiResponse<any>>('/api/professors/verify-request', formData);
  }

  listVerificationRequests(params?: {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
  }): Observable<IPaginatedResponse<any[]>> {
    return this.http.get<IPaginatedResponse<any[]>>('/api/professors/verification-requests/list', {
      params: params as any,
    });
  }

  processVerificationRequest(
    id: string,
    payload: { status: 'approved' | 'rejected'; notes?: string },
  ): Observable<IApiResponse<any>> {
    return this.http.patch<IApiResponse<any>>(
      `/api/professors/verification-requests/${id}/process`,
      payload,
    );
  }

  createProfessor(professor: ICreateProfessorDTO): Observable<IApiResponse<IProfessor>> {
    return this.http.post<IApiResponse<IProfessor>>('/api/professors', professor);
  }

  updateProfessor(id: string, professor: IUpdateProfessorDTO): Observable<IApiResponse<IProfessor>> {
    return this.http.patch<IApiResponse<IProfessor>>(`/api/professors/${id}`, professor);
  }

  deleteProfessor(id: string): Observable<IApiResponse<void>> {
    return this.http.delete<IApiResponse<void>>(`/api/professors/${id}`);
  }
}
