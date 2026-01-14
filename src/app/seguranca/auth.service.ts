import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { firstValueFrom } from 'rxjs';
import { environment } from './../../environments/environment';

@Injectable()
export class AuthService {

  oauthTokenUrl: string;
  jwtPayload: any;
  private jwtHelper: JwtHelperService;

  constructor(
    private http: HttpClient
  ) {
    this.jwtHelper = new JwtHelperService();
    this.verificarSessao();
    this.carregarToken();
    this.oauthTokenUrl = `${environment.apiUrl}/oauth/token`;
  }

  private verificarSessao() {
    // Gera um ID único para esta sessão do navegador (apenas na memória, não persiste)
    const sessionId = sessionStorage.getItem('app_session_id');

    if (!sessionId) {
      // Nova sessão - limpa qualquer token persistente
      this.limparAccessToken();
      // Cria novo ID de sessão
      sessionStorage.setItem('app_session_id', Date.now().toString());
    }
  }

  login(usuario: string, senha: string): Promise<void> {
    // SECURITY WARNING: Client secret should NOT be in frontend code
    // TODO: Migrate to BFF Pattern or OAuth PKCE Flow
    // Current implementation is TEMPORARY and INSECURE for production
    const clientSecret = environment.oauthClientSecret || '';

    if (!clientSecret) {
      console.warn('⚠️ SECURITY: OAuth client secret not configured. This app requires BFF or PKCE implementation.');
      return Promise.reject('Autenticação não configurada corretamente. Contate o administrador.');
    }

    const credentials = btoa(`${environment.oauthClientId}:${clientSecret}`);
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', `Basic ${credentials}`);

    const body = `username=${usuario}&password=${senha}&grant_type=password`;

    return firstValueFrom(
      this.http.post<any>(this.oauthTokenUrl, body, { headers, withCredentials: true })
    )
      .then(response => {
        this.armazenarToken(response.access_token);
      })
      .catch(error => {
        if (error.status === 400) {
          const responseJson = error.error;

          if (responseJson.error === 'invalid_grant') {
            return Promise.reject('Usuário ou senha inválida!');
          }
        }

        return Promise.reject(error);
      });
  }

  obterNovoAccessToken(): Promise<void> {
    // SECURITY WARNING: Client secret should NOT be in frontend code
    // TODO: Migrate to BFF Pattern or OAuth PKCE Flow
    const clientSecret = environment.oauthClientSecret || '';

    if (!clientSecret) {
      console.warn('⚠️ SECURITY: OAuth client secret not configured.');
      return Promise.resolve(); // Silently fail, user will need to re-login
    }

    const credentials = btoa(`${environment.oauthClientId}:${clientSecret}`);
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', `Basic ${credentials}`);

    const body = 'grant_type=refresh_token';

    return firstValueFrom(
      this.http.post<any>(this.oauthTokenUrl, body, { headers, withCredentials: true })
    )
      .then(response => {
        this.armazenarToken(response.access_token);

        return Promise.resolve();
      })
      .catch(error => {
        console.error('Erro ao renovar token.', error);
        return Promise.resolve();
      });
  }

  limparAccessToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('token_created_at');
    this.jwtPayload = null;
  }

  isAccessTokenInvalido() {
    const token = localStorage.getItem('token');

    if (!token) {
      return true;
    }

    // Verifica se o token está expirado pela biblioteca JWT
    if (this.jwtHelper.isTokenExpired(token)) {
      return true;
    }

    // Verifica se o token foi criado há mais de 24 horas
    // Isso força o usuário a fazer login novamente após reiniciar o container
    const tokenCreatedAt = localStorage.getItem('token_created_at');
    if (tokenCreatedAt) {
      const createdTime = parseInt(tokenCreatedAt, 10);
      const now = new Date().getTime();
      const hoursSinceCreated = (now - createdTime) / (1000 * 60 * 60);

      // Se passou mais de 24 horas, considera o token inválido
      if (hoursSinceCreated > 24) {
        return true;
      }
    }

    return false;
  }

  temPermissao(permissao: string) {
    return this.jwtPayload && this.jwtPayload.authorities.includes(permissao);
  }

  temQualquerPermissao(roles: string[]) {
    for (const role of roles) {
      if (this.temPermissao(role)) {
        return true;
      }
    }

    return false;
  }

  private armazenarToken(token: string) {
    this.jwtPayload = this.jwtHelper.decodeToken(token);
    localStorage.setItem('token', token);
    // Armazena o timestamp de criação do token
    localStorage.setItem('token_created_at', new Date().getTime().toString());
  }

  private carregarToken() {
    const token = localStorage.getItem('token');

    if (token) {
      this.armazenarToken(token);
    }
  }

}
