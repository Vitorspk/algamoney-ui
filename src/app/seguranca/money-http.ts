import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';

export class NotAuthenticatedError {}

@Injectable()
export class MoneyHttpInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Não intercepta requisições de login/token
    if (req.url.includes('/oauth/token')) {
      return next.handle(req);
    }

    // Se o token está inválido, tenta renovar
    if (this.auth.isAccessTokenInvalido()) {
      console.log('Requisição HTTP com access token inválido. Obtendo novo token...');

      return from(this.auth.obterNovoAccessToken()).pipe(
        switchMap(() => {
          if (this.auth.isAccessTokenInvalido()) {
            throw new NotAuthenticatedError();
          }
          return next.handle(this.addToken(req));
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
    }

    return next.handle(this.addToken(req));
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = localStorage.getItem('token');

    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return req;
  }
}
