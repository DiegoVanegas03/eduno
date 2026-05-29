import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IApiResponse,
  IPaginatedResponse,
  ISchedule,
  ICreateScheduleDTO,
  IUpdateScheduleDTO,
  IScheduleQueryDTO,
} from '@eduno/shared';

@Injectable({
  providedIn: 'root',
})
export class AdminSchedulesService {
  private http = inject(HttpClient);

  getSchedules(params?: IScheduleQueryDTO): Observable<IPaginatedResponse<ISchedule[]>> {
    return this.http.get<IPaginatedResponse<ISchedule[]>>('/api/schedules', {
      params: params as any,
    });
  }

  getPeriods(): Observable<IApiResponse<string[]>> {
    return this.http.get<IApiResponse<string[]>>('/api/schedules/periods');
  }

  createSchedule(schedule: ICreateScheduleDTO): Observable<IApiResponse<ISchedule>> {
    return this.http.post<IApiResponse<ISchedule>>('/api/schedules', schedule);
  }

  updateSchedule(id: string, schedule: IUpdateScheduleDTO): Observable<IApiResponse<ISchedule>> {
    return this.http.patch<IApiResponse<ISchedule>>(`/api/schedules/${id}`, schedule);
  }

  deleteSchedule(id: string): Observable<IApiResponse<void>> {
    return this.http.delete<IApiResponse<void>>(`/api/schedules/${id}`);
  }

  scrapeSchedules(period: string, areaCode: number): Observable<IApiResponse<{
    areaName: string;
    areaCode: number;
    period: string;
    totalInserted: number;
  }>> {
    return this.http.post<IApiResponse<{
      areaName: string;
      areaCode: number;
      period: string;
      totalInserted: number;
    }>>('/api/schedules/scrape', { period, areaCode });
  }
}
