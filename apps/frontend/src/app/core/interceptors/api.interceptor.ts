import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../services/auth/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

export const apiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // 1. Prepend Base URL
  let apiReq = req;
  if (req.url.startsWith('/api')) {
    apiReq = req.clone({
      url: req.url.replace('/api', environment.apiUrl),
    });
  } else if (!req.url.startsWith('http') && !req.url.startsWith('assets')) {
    apiReq = req.clone({
      url: `${environment.apiUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`,
    });
  }

  // 2. Add withCredentials for Cookie Support
  apiReq = apiReq.clone({
    withCredentials: true,
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Handle 401 Unauthorized (Token Expired)
      if (error.status === 401 && !apiReq.url.includes('/auth/')) {
        return handle401Error(apiReq, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

const handle401Error = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<any>> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(false);

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        refreshTokenSubject.next(true);
        return next(req);
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      }),
    );
  } else {
    // Wait until refresh is done
    return refreshTokenSubject.pipe(
      filter((success) => success === true),
      take(1),
      switchMap(() => next(req)),
    );
  }
};
