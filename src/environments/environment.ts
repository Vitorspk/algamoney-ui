// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

/**
 * Configuração de Desenvolvimento
 *
 * Para desenvolvimento local, você pode usar valores hardcoded.
 * Para produção, SEMPRE use variáveis de ambiente via window.__env
 */
export const environment = {
  production: false,
  apiUrl: (window as any).__env?.apiUrl || 'http://localhost:8080',
  oauthClientId: (window as any).__env?.oauthClientId || 'angular',
  oauthClientSecret: (window as any).__env?.oauthClientSecret || '@ngu1@rM' // Apenas para DEV local
};
