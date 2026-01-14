/**
 * Configuração de Produção
 *
 * ⚠️ CRITICAL SECURITY: oauthClientSecret REMOVIDO
 *
 * Para usar autenticação em produção, implemente uma das soluções:
 * 1. BFF Pattern (Backend-for-Frontend) - RECOMENDADO
 * 2. OAuth PKCE (veja auth-pkce.service.ts)
 *
 * Veja MIGRATION-SECURITY.md para guia completo de implementação
 */
export const environment = {
  production: true,
  apiUrl: (window as any).__env?.apiUrl || 'https://api.algamoney.com',
  oauthClientId: (window as any).__env?.oauthClientId || 'angular',
  // ⛔ oauthClientSecret REMOVIDO - NÃO É SEGURO EM FRONTEND
  // Para usar autenticação, implemente BFF ou PKCE
};
