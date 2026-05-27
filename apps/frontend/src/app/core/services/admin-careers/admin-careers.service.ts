import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IApiResponse,
  ICareer,
  ICreateCareerDTO,
  IUpdateCareerDTO,
  IStudyPlan,
  ICreateStudyPlanDTO,
  IUpdateStudyPlanDTO,
  ICarrerListQuerySchema,
} from '@eduno/shared';

@Injectable({
  providedIn: 'root',
})
export class AdminCareersService {
  private http = inject(HttpClient);

  // ── Careers Endpoints ────────────────────────────────────────────────────────

  getCareers(params?: ICarrerListQuerySchema): Observable<IApiResponse<ICareer[]>> {
    return this.http.get<IApiResponse<ICareer[]>>('/api/careers', {
      params: params,
    });
  }

  getCareerById(id: string): Observable<IApiResponse<ICareer>> {
    return this.http.get<IApiResponse<ICareer>>(`/api/careers/${id}`);
  }

  createCareer(career: ICreateCareerDTO): Observable<IApiResponse<ICareer>> {
    return this.http.post<IApiResponse<ICareer>>('/api/careers', career);
  }

  updateCareer(id: string, career: IUpdateCareerDTO): Observable<IApiResponse<ICareer>> {
    return this.http.patch<IApiResponse<ICareer>>(`/api/careers/${id}`, career);
  }

  deleteCareer(id: string): Observable<IApiResponse<ICareer>> {
    return this.http.delete<IApiResponse<ICareer>>(`/api/careers/${id}`);
  }

  // ── StudyPlans Endpoints ──────────────────────────────────────────────────────

  getStudyPlans(params?: {
    career?: string;
    isActive?: boolean;
  }): Observable<IApiResponse<IStudyPlan[]>> {
    return this.http.get<IApiResponse<IStudyPlan[]>>('/api/study-plans', {
      params: params,
    });
  }

  getStudyPlanById(id: string): Observable<IApiResponse<IStudyPlan>> {
    return this.http.get<IApiResponse<IStudyPlan>>(`/api/study-plans/${id}`);
  }

  createStudyPlan(studyPlan: ICreateStudyPlanDTO): Observable<IApiResponse<IStudyPlan>> {
    return this.http.post<IApiResponse<IStudyPlan>>('/api/study-plans', studyPlan);
  }

  updateStudyPlan(
    id: string,
    studyPlan: IUpdateStudyPlanDTO,
  ): Observable<IApiResponse<IStudyPlan>> {
    return this.http.patch<IApiResponse<IStudyPlan>>(`/api/study-plans/${id}`, studyPlan);
  }

  deleteStudyPlan(id: string): Observable<IApiResponse<IStudyPlan>> {
    return this.http.delete<IApiResponse<IStudyPlan>>(`/api/study-plans/${id}`);
  }

  scrapeStudyPlan(id: string): Observable<IApiResponse<IStudyPlan>> {
    return this.http.post<IApiResponse<IStudyPlan>>(`/api/study-plans/${id}/scrape`, {});
  }
}
