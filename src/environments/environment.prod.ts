/**
 * Configuração de Produção
 *
 * IMPORTANTE: Credenciais são carregadas via window.__env em runtime
 * Configurado pelo script inject-env.sh no Docker container
 *
 * NUNCA commite credenciais hardcoded neste arquivo!
 */
export const environment = {
  production: true,
  apiUrl: (window as any).__env?.apiUrl || 'https://api.algamoney.com',
  oauthClientId: (window as any).__env?.oauthClientId || 'angular',
  oauthClientSecret: (window as any).__env?.oauthClientSecret || ''
};
