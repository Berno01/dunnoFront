import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  // Clonar la petición y agregar el header X-Usuario-Id
  const clonedRequest = req.clone({
    setHeaders: {
      'X-Usuario-Id': sessionService.userId().toString(),
    },
  });

  return next(clonedRequest);
};
