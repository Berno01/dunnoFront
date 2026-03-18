import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const apiBaseUrl = environment.apiUrl.replace(/\/+$/, '');

  // Solo aplicar headers internos a requests del backend propio.
  const isBackendRequest = req.url.startsWith(apiBaseUrl) || req.url.startsWith('/api/');
  if (!isBackendRequest) {
    return next(req);
  }

  // Excluir endpoints de autenticación (login)
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const userId = sessionService.userId();
  if (!userId || req.headers.has('X-Usuario-Id')) {
    return next(req);
  }

  // Clonar la petición y agregar el header X-Usuario-Id
  const clonedRequest = req.clone({
    setHeaders: {
      'X-Usuario-Id': userId.toString(),
    },
  });

  return next(clonedRequest);
};
