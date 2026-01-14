# Guia de Segurança - AlgaMoney UI

## ⚠️ IMPORTANTE: OAuth Client Secret

### Problema de Segurança Crítico

O `oauthClientSecret` **NUNCA** deve estar no código frontend. Todo código JavaScript é visível ao usuário final, tornando qualquer "secret" exposto.

### Solução Recomendada

#### Opção 1: Backend-for-Frontend (BFF) Pattern ✅ **RECOMENDADO**

Crie um endpoint no backend que gerencia a autenticação:

```typescript
// Frontend (auth.service.ts)
login(usuario: string, senha: string): Promise<void> {
  // Envia apenas usuário e senha para o backend
  return this.http.post('/api/auth/login', { usuario, senha })
    .then(response => {
      this.armazenarToken(response.access_token);
    });
}
```

```java
// Backend (AuthController.java)
@PostMapping("/auth/login")
public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
    // O backend tem acesso seguro ao clientSecret
    String credentials = Base64.encode(clientId + ":" + clientSecret);

    // Faz a chamada OAuth com credenciais seguras
    TokenResponse tokens = oauthClient.getToken(
        request.getUsername(),
        request.getPassword(),
        credentials
    );

    return ResponseEntity.ok(tokens);
}
```

#### Opção 2: Public Client (OAuth PKCE)

Para aplicações SPA, use o fluxo PKCE (Proof Key for Code Exchange) que não requer client secret:

```typescript
// Configuração OAuth PKCE
const config = {
  clientId: 'angular-public',
  // Sem clientSecret!
  authorizationEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  pkce: true  // Usa PKCE ao invés de client secret
};
```

### Estado Atual do Código

Atualmente, o código possui `oauthClientSecret` hardcoded. Isto é **INSEGURO** e deve ser corrigido antes de produção.

**Arquivos afetados:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/seguranca/auth.service.ts`

### Implementação de Runtime Configuration

Foi criado um sistema de runtime configuration para remover credenciais do bundle:

1. **ConfigService** (`src/app/core/config.service.ts`):
   - Carrega configurações em runtime
   - Suporta variáveis de ambiente Docker

2. **Scripts Docker**:
   - `inject-env.sh`: Injeta variáveis de ambiente
   - `entrypoint.sh`: Executa injeção no startup

3. **Arquivo de Config** (`assets/config/env.json`):
   - Configurações não-sensíveis
   - Gerado em runtime pelo Docker

### Variáveis de Ambiente Docker

```yaml
# docker-compose.yml
environment:
  - API_URL=https://api.production.com
  - OAUTH_CLIENT_ID=angular
  - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}  # Nunca commite este valor!
```

### Checklist de Segurança

Antes de deploy em produção:

- [ ] **CRÍTICO**: Implementar BFF pattern ou PKCE
- [ ] Remover `oauthClientSecret` de `environment.ts`
- [ ] Remover `oauthClientSecret` de `environment.prod.ts`
- [ ] Atualizar `auth.service.ts` para usar backend
- [ ] Rotacionar credenciais OAuth existentes
- [ ] Configurar variáveis de ambiente no servidor
- [ ] Adicionar secrets no CI/CD (GitHub Actions, GitLab CI)
- [ ] Nunca commitar `.env` files
- [ ] Revisar todos os PRs para credenciais expostas
- [ ] Implementar secret scanning (GitHub Secret Scanning, GitGuardian)

### Recursos Adicionais

- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [PKCE for OAuth Public Clients](https://oauth.net/2/pkce/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Suporte

Para questões de segurança, abra uma issue privada no repositório ou entre em contato com a equipe de segurança.

## Outras Considerações de Segurança

### CORS Configuration

O arquivo `nginx/default.conf` usa `Access-Control-Allow-Origin "*"` para desenvolvimento. Em produção:

```nginx
# Produção - use domínios específicos
add_header Access-Control-Allow-Origin "https://algamoney.com";
```

### Content Security Policy

Adicione CSP headers no nginx para produção:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### HTTPS Only

Sempre use HTTPS em produção. Configure redirect no nginx:

```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```