import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService, OAuthEvent, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';
import { authPkceConfig } from './auth.config';

/**
 * Serviço de Autenticação usando OAuth 2.0 com PKCE
 *
 * ✅ SEGURO: Não usa client secret
 * ✅ Padrão da indústria para SPAs
 * ✅ RFC 7636 compliant
 *
 * Substitui o antigo AuthService que usava client secret inseguro
 */
@Injectable({
  providedIn: 'root'
})
export class AuthPkceService {

  constructor(
    private oauthService: OAuthService,
    private router: Router
  ) {
    this.configureOAuth();
    this.setupAutomaticSilentRefresh();
  }

  /**
   * Configura o OAuth Service com PKCE
   */
  private configureOAuth(): void {
    this.oauthService.configure(authPkceConfig);

    // Carrega o discovery document (se o servidor OAuth suportar)
    // Se não suportar, os endpoints são configurados manualmente no authPkceConfig
    this.oauthService.loadDiscoveryDocument().catch(() => {
      console.warn('Discovery document not available. Using manual configuration.');
    });

    // Escuta eventos do OAuth
    this.oauthService.events
      .pipe(filter((e: OAuthEvent) => e.type === 'token_received'))
      .subscribe(() => {
        console.log('✅ Token recebido com sucesso');
      });

    this.oauthService.events
      .pipe(filter((e: OAuthEvent) => e instanceof OAuthErrorEvent))
      .subscribe((e: OAuthErrorEvent) => {
        console.error('❌ Erro OAuth:', e);
      });

    // Tenta fazer login silencioso ao carregar a aplicação
    this.oauthService.tryLoginImplicitFlow().then(() => {
      if (!this.oauthService.hasValidAccessToken()) {
        // Se não tem token válido, não faz nada (usuário precisa fazer login)
        console.log('Nenhum token válido encontrado');
      } else {
        console.log('Token válido encontrado - usuário autenticado');
      }
    });
  }

  /**
   * Configura renovação automática de tokens
   */
  private setupAutomaticSilentRefresh(): void {
    this.oauthService.setupAutomaticSilentRefresh();
  }

  /**
   * Inicia o fluxo de login (redireciona para servidor OAuth)
   */
  login(): void {
    this.oauthService.initCodeFlow();
  }

  /**
   * Realiza logout
   */
  logout(): Promise<void> {
    return new Promise((resolve) => {
      this.oauthService.logOut();
      this.router.navigate(['/login']);
      resolve();
    });
  }

  /**
   * Verifica se o usuário está autenticado
   */
  get isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  /**
   * Retorna o access token
   */
  get accessToken(): string {
    return this.oauthService.getAccessToken();
  }

  /**
   * Retorna o ID token (se disponível)
   */
  get idToken(): string {
    return this.oauthService.getIdToken();
  }

  /**
   * Retorna as claims do ID token
   */
  get identityClaims(): any {
    return this.oauthService.getIdentityClaims();
  }

  /**
   * Retorna o payload do JWT
   */
  get jwtPayload(): any {
    try {
      const token = this.accessToken;
      if (!token) return null;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erro ao decodificar JWT:', error);
      return null;
    }
  }

  /**
   * Verifica se o token está expirado ou prestes a expirar
   */
  get isAccessTokenExpired(): boolean {
    const expiresAt = this.oauthService.getAccessTokenExpiration();
    if (!expiresAt) return true;

    // Considera expirado se faltar menos de 5 minutos
    const bufferTime = 5 * 60 * 1000; // 5 minutos em ms
    return Date.now() + bufferTime >= expiresAt;
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  temPermissao(permissao: string): boolean {
    const payload = this.jwtPayload;
    if (!payload || !payload.authorities) {
      return false;
    }
    return payload.authorities.includes(permissao);
  }

  /**
   * Verifica se o usuário tem qualquer uma das permissões fornecidas
   */
  temQualquerPermissao(roles: string[]): boolean {
    for (const role of roles) {
      if (this.temPermissao(role)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Renova o access token
   */
  async refreshToken(): Promise<void> {
    try {
      await this.oauthService.silentRefresh();
      console.log('✅ Token renovado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      // Se falhar, faz logout
      await this.logout();
    }
  }

  /**
   * Limpa os tokens armazenados
   */
  limparAccessToken(): void {
    this.oauthService.logOut(true);
  }

  /**
   * Retorna informações do usuário
   */
  getUserInfo(): Promise<any> {
    return this.oauthService.loadUserProfile();
  }
}
