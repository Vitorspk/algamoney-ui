# 🔴 PLANO DE MIGRAÇÃO URGENTE - Segurança OAuth

## Status Atual

❌ **INSEGURO**: Client secret exposto no frontend
⚠️ **BLOQUEADOR**: Não pode ir para produção
📅 **Prazo**: Implementar antes do deploy

## Problemas Identificados

### 1. OAuth Client Secret no Frontend (CRÍTICO)
- **Arquivo**: `src/app/seguranca/auth.service.ts`
- **Linhas**: 36, 63
- **Risco**: Credenciais visíveis no código JavaScript
- **Impacto**: Qualquer usuário pode extrair o secret via DevTools

### 2. CSP Permite unsafe-eval (MÉDIO)
- **Arquivo**: `.docker/nginx/default.conf`
- **Linha**: 19
- **Risco**: Permite execução de código JavaScript dinâmico
- **Causa**: Chart.js requer unsafe-eval

### 3. CORS com Fallback Amplo (MÉDIO)
- **Arquivo**: `.docker/nginx/default.conf`
- **Linhas**: 66-69
- **Risco**: Fallback para localhost:4200 pode ser explorado
- **Recomendação**: Remover fallback em produção

## Soluções Recomendadas

### ✅ Solução 1: Backend-for-Frontend (BFF) - RECOMENDADO

**Complexidade**: Média
**Tempo estimado**: 2-3 dias
**Segurança**: Alta

#### Passos de Implementação

**1. Backend (Java/Spring)**

Criar novo endpoint de autenticação:

```java
// AuthController.java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${oauth.client.id}")
    private String clientId;

    @Value("${oauth.client.secret}")
    private String clientSecret;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        // Monta credenciais Basic Auth (SERVIDOR-SIDE APENAS)
        String credentials = Base64.getEncoder()
            .encodeToString((clientId + ":" + clientSecret).getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + credentials);

        String body = String.format(
            "username=%s&password=%s&grant_type=password",
            request.getUsername(),
            request.getPassword()
        );

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<TokenResponse> response = restTemplate.exchange(
                "http://oauth-server/oauth/token",
                HttpMethod.POST,
                entity,
                TokenResponse.class
            );

            return ResponseEntity.ok(response.getBody());
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                return ResponseEntity.status(401)
                    .body(new TokenResponse("Usuário ou senha inválida"));
            }
            throw e;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
        @CookieValue("refresh_token") String refreshToken
    ) {
        // Similar ao login, mas usando refresh_token
        // ...
    }
}
```

**2. Frontend (Angular)**

Atualizar `auth.service.ts`:

```typescript
// auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { firstValueFrom } from 'rxjs';
import { environment } from './../../environments/environment';

interface LoginRequest {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  private apiUrl = environment.apiUrl;
  jwtPayload: any;
  private jwtHelper: JwtHelperService;

  constructor(private http: HttpClient) {
    this.jwtHelper = new JwtHelperService();
    this.verificarSessao();
    this.carregarToken();
  }

  // ✅ SEGURO: Não usa client secret
  login(usuario: string, senha: string): Promise<void> {
    const body: LoginRequest = {
      username: usuario,
      password: senha
    };

    return firstValueFrom(
      this.http.post<TokenResponse>(`${this.apiUrl}/api/auth/login`, body)
    )
      .then(response => {
        this.armazenarToken(response.access_token);
      })
      .catch(error => {
        if (error.status === 401) {
          return Promise.reject('Usuário ou senha inválida!');
        }
        return Promise.reject(error);
      });
  }

  // ✅ SEGURO: Backend gerencia refresh
  obterNovoAccessToken(): Promise<void> {
    return firstValueFrom(
      this.http.post<TokenResponse>(`${this.apiUrl}/api/auth/refresh`, {})
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

  // ... resto dos métodos permanecem iguais
}
```

**3. Configuração Backend**

```yaml
# application-prod.yml
oauth:
  client:
    id: ${OAUTH_CLIENT_ID}
    secret: ${OAUTH_CLIENT_SECRET}  # Apenas no backend!
```

**4. Docker/Kubernetes**

```yaml
# docker-compose.yml ou k8s secret
environment:
  - OAUTH_CLIENT_ID=angular
  - OAUTH_CLIENT_SECRET=your-secret-here  # Apenas no backend container
```

#### Vantagens do BFF
✅ Client secret nunca exposto
✅ Controle total da autenticação
✅ Pode adicionar rate limiting
✅ Logs centralizados de autenticação
✅ Facilita implementação de MFA futuramente

---

### 🔄 Solução 2: OAuth PKCE (Public Client Flow)

**Complexidade**: Baixa
**Tempo estimado**: 1 dia
**Segurança**: Alta

#### Requisitos
- OAuth server deve suportar PKCE (RFC 7636)
- Configurar aplicação como "Public Client"
- **Não requer client secret**

#### Implementação

**1. Instalar dependência**

```bash
npm install angular-oauth2-oidc
```

**2. Configurar OAuth PKCE**

```typescript
// auth.config.ts
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://oauth-server.com',
  redirectUri: window.location.origin,
  clientId: 'angular-public',
  // ✅ NÃO TEM client secret!
  responseType: 'code',
  scope: 'openid profile email',
  showDebugInformation: true,

  // ✅ PKCE ativado
  useSilentRefresh: true,
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html'
};
```

**3. Implementar serviço**

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';

@Injectable()
export class AuthService {
  constructor(private oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  get accessToken() {
    return this.oauthService.getAccessToken();
  }

  get isAuthenticated() {
    return this.oauthService.hasValidAccessToken();
  }
}
```

#### Vantagens do PKCE
✅ Sem client secret
✅ Padrão da indústria para SPAs
✅ Suportado por todos os provedores OAuth modernos
✅ Implementação simples
✅ Segurança comprovada

---

## Cronograma de Implementação

### Fase 1: Preparação (1 dia)
- [ ] Revisar documentação OAuth do servidor
- [ ] Escolher solução (BFF ou PKCE)
- [ ] Criar branch de migração
- [ ] Configurar ambiente de testes

### Fase 2: Implementação (2-3 dias)
- [ ] Implementar solução escolhida
- [ ] Atualizar testes unitários
- [ ] Atualizar testes de integração
- [ ] Atualizar documentação

### Fase 3: Testes (1-2 dias)
- [ ] Testes de segurança
- [ ] Testes de regressão
- [ ] Testes de performance
- [ ] Validação de tokens

### Fase 4: Deploy (1 dia)
- [ ] Deploy em staging
- [ ] Validação em staging
- [ ] Deploy em produção
- [ ] Rotação de credenciais antigas

## Checklist de Segurança Pós-Migração

### OAuth
- [ ] Client secret removido do código frontend
- [ ] Client secret apenas em variáveis de ambiente do backend
- [ ] Tokens com expiração apropriada (15min access, 7d refresh)
- [ ] Refresh token rotation ativado
- [ ] HTTPS obrigatório em produção

### CSP
- [ ] Revisar se unsafe-eval ainda é necessário
- [ ] Considerar hash-based CSP para scripts inline
- [ ] Remover unsafe-inline se possível
- [ ] Adicionar report-uri para monitoramento

### CORS
- [ ] Remover fallback wildcard/localhost em produção
- [ ] Listar explicitamente domínios permitidos
- [ ] Configurar CORS no backend também
- [ ] Validar preflight requests

### Infraestrutura
- [ ] Secrets em vault/secret manager (não em env files)
- [ ] Rate limiting em endpoints de autenticação
- [ ] WAF configurado
- [ ] Logs de autenticação centralizados
- [ ] Alertas de tentativas de autenticação suspeitas

## Recursos Adicionais

- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Angular OAuth2 OIDC Library](https://github.com/manfredsteyer/angular-oauth2-oidc)

## Contatos

Para dúvidas sobre esta migração:
- Equipe de Segurança: security@algamoney.com
- Arquitetura: architecture@algamoney.com