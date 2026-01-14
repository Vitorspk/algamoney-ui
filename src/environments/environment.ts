// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

/**
 * Configuração de Desenvolvimento
 *
 * ⚠️ SECURITY WARNING: Cliente secret mantido APENAS para desenvolvimento local
 * NÃO usar em produção!
 *
 * Para produção, implemente BFF ou PKCE (veja MIGRATION-SECURITY.md)
 */
export const environment = {
  production: false,
  apiUrl: (window as any).__env?.apiUrl || 'http://localhost:8080',
  oauthClientId: (window as any).__env?.oauthClientId || 'angular',
  // ⚠️ APENAS DESENVOLVIMENTO LOCAL - Remover antes de produção
  oauthClientSecret: (window as any).__env?.oauthClientSecret || '@ngu1@rM'
};
