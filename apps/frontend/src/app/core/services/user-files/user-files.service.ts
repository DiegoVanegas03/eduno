import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApiResponse, IFile, IDownloadStats } from '@eduno/shared';

@Injectable({
  providedIn: 'root',
})
export class UserFilesService {
  private http = inject(HttpClient);

  /**
   * Upload a student note to a subject (materia).
   */
  uploadFile(materiaId: string, file: File): Observable<IApiResponse<IFile>> {
    const formData = new FormData();
    formData.append('materiaId', materiaId);
    formData.append('documento', file);

    return this.http.post<IApiResponse<IFile>>('/api/files/upload', formData);
  }

  /**
   * Download a file secure with quota validations.
   * Returns a binary blob.
   */
  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });
  }

  /**
   * Fetch download statistics and quotas for the logged-in student.
   */
  getDownloadStats(): Observable<IApiResponse<IDownloadStats>> {
    return this.http.get<IApiResponse<IDownloadStats>>('/api/users/download-stats');
  }

  /**
   * List files uploaded by the authenticated student.
   */
  getMyUploads(): Observable<IApiResponse<IFile[]>> {
    return this.http.get<IApiResponse<IFile[]>>('/api/files/my-uploads');
  }

  /**
   * Delete an uploaded file.
   */
  deleteUpload(fileId: string): Observable<IApiResponse<unknown>> {
    return this.http.delete<IApiResponse<unknown>>(`/api/files/${fileId}`);
  }

  /**
   * Report an uploaded study note.
   */
  reportFile(fileId: string, reasonType: string, description: string): Observable<IApiResponse<unknown>> {
    return this.http.post<IApiResponse<unknown>>('/api/professors/reports/create', {
      targetType: 'file',
      targetId: fileId,
      reasonType,
      description,
    });
  }

  /**
   * List all files pending moderation (Admin only).
   */
  getPendingFiles(): Observable<IApiResponse<IFile[]>> {
    return this.http.get<IApiResponse<IFile[]>>('/api/files/pending');
  }

  /**
   * Moderate a pending file (approve or reject) (Admin only).
   */
  moderateFile(fileId: string, status: 'approved' | 'rejected'): Observable<IApiResponse<IFile>> {
    return this.http.post<IApiResponse<IFile>>(`/api/files/${fileId}/moderate`, {
      status,
    });
  }
}
