import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  // Excluir endpoints de autenticación (login)
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Clonar la petición y agregar el header X-Usuario-Id
  const clonedRequest = req.clone({
    setHeaders: {
      'X-Usuario-Id': sessionService.userId().toString(),
    },
  });

  return next(clonedRequest);
};
