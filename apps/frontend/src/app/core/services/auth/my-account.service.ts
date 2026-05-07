import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, filter, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/services/auth/auth.service';
import { IUpdateProfileDTO, IBetterAuthUser, IApiResponse } from '@eduno/shared';

export interface ProfileData extends IBetterAuthUser {
  career: string;
  semester: string;
  description: string;
  downloadsLeft: number;
  maxDownloads: number;
  lastDownloadDate: string | null;
  totalUploads: number;
  initialLetter?: string;
  connectedAccounts: { provider: 'google' | 'microsoft'; connected: boolean; email?: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class MyAccountService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);


  getSemesterOptions(career: string): Observable<{ label: string; value: string }[]> {
    // Simulate dynamic semesters based on career
    return of([]).pipe(
      delay(300),
      map(() => {
        if (career.toLowerCase().includes('computación')) {
          return [
            { label: 'Primer Semestre', value: '1' },
            { label: 'Segundo Semestre', value: '2' },
            { label: 'Tercer Semestre', value: '3' },
            { label: 'Cuarto Semestre', value: '4' },
            { label: 'Quinto Semestre', value: '5' },
            { label: 'Sexto Semestre', value: '6' },
            { label: 'Séptimo Semestre', value: '7' },
            { label: 'Octavo Semestre', value: '8' },
            { label: 'Noveno Semestre', value: '9' },
            { label: 'Décimo Semestre', value: '10' },
          ];
        }
        return [
          { label: 'Semestre 1', value: '1' },
          { label: 'Semestre 2', value: '2' },
          { label: 'Semestre 3', value: '3' },
          { label: 'Semestre 4', value: '4' },
          { label: 'Semestre 5', value: '5' },
          { label: 'Semestre 6', value: '6' },
        ];
      }),
    );
  }

  updateProfile(data: IUpdateProfileDTO): Observable<IApiResponse<IBetterAuthUser>> {
    return this.http.patch<IApiResponse<IBetterAuthUser>>(`/api/users/profile`, data);
  }

  updateProfileFormData(data: FormData): Observable<IApiResponse<IBetterAuthUser>> {
    return this.http.patch<IApiResponse<IBetterAuthUser>>(`/api/users/profile`, data);
  }
}
