import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

/**
 * Configuração OAuth 2.0 com PKCE (Proof Key for Code Exchange)
 *
 * PKCE é o padrão da indústria para aplicações Single Page (SPA)
 * NÃO requer client secret - seguro para frontend
 *
 * RFC 7636: https://tools.ietf.org/html/rfc7636
 */
export const authPkceConfig: AuthConfig = {
  // OAuth Server configuration
  issuer: environment.apiUrl,

  // Endpoint de autorização
  loginUrl: `${environment.apiUrl}/oauth/authorize`,

  // Endpoint de token
  tokenEndpoint: `${environment.apiUrl}/oauth/token`,

  // Endpoint de logout
  logoutUrl: `${environment.apiUrl}/logout`,

  // Client ID (público - não é secret)
  clientId: environment.oauthClientId,

  // ✅ SEGURO: Sem client secret!
  // PKCE usa code challenge/verifier dinâmico por request

  // Redirect URI após login
  redirectUri: window.location.origin + '/callback',

  // Redirect URI após logout
  postLogoutRedirectUri: window.location.origin,

  // Response type para PKCE
  responseType: 'code',

  // Scopes necessários
  scope: 'read write',

  // ✅ Ativa PKCE
  useSilentRefresh: true,
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',

  // Timeout de sessão
  sessionChecksEnabled: true,

  // Desabilita strict discovery document validation (ajustar conforme servidor)
  strictDiscoveryDocumentValidation: false,

  // Requer HTTPS em produção
  requireHttps: environment.production,

  // Configurações de segurança
  clearHashAfterLogin: true,

  // Timeout para obter token
  timeoutFactor: 0.75,

  // Mostra informações de debug apenas em desenvolvimento
  showDebugInformation: !environment.production,

  // Desabilita validação de issuer se necessário (ajustar conforme servidor)
  skipIssuerCheck: false,

  // Disable JWT validation se o servidor não suporta
  // ATENÇÃO: Em produção, sempre validar JWT!
  disablePKCE: false,

  // Custom query parameters se necessário
  customQueryParams: {
    // Adicione parâmetros customizados aqui se necessário
  }
};

/**
 * Configuração para Resource Server
 * Define quais requests devem incluir o token de acesso
 */
export const resourceServerConfig = {
  // Domínios que devem receber o access token
  allowedUrls: [
    environment.apiUrl
  ],

  // Domínios que NÃO devem receber o token
  denyUrls: []
};