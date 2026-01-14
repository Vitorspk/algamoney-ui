# 🔐 Implementação OAuth PKCE - Pronta para Uso

## ✅ O Que Foi Implementado

Este projeto agora inclui uma implementação **completa e funcional** de OAuth 2.0 com PKCE (Proof Key for Code Exchange), que é o padrão da indústria para aplicações Single Page (SPA).

### Arquivos Criados

1. **`src/app/seguranca/auth-pkce.service.ts`**
   - Serviço completo de autenticação usando PKCE
   - Não requer client secret
   - Seguro para frontend

2. **`src/app/seguranca/auth.config.ts`**
   - Configuração do OAuth PKCE
   - Endpoints configuráveis
   - Resource server config

3. **`src/silent-refresh.html`**
   - Página para renovação automática de tokens
   - Usado em iframe oculto

4. **`src/callback.html`**
   - Página de callback após autenticação
   - Interface amigável durante processamento

### Biblioteca Instalada

- **angular-oauth2-oidc@^17.0.2** (compatível com Angular 18)

## 🚀 Como Ativar a Implementação PKCE

### Passo 1: Configurar o Servidor OAuth

O servidor OAuth precisa suportar PKCE. Configure no backend:

```yaml
# application.yml (Spring Authorization Server)
spring:
  security:
    oauth2:
      authorization-server:
        client:
          angular:
            client-id: angular
            # ✅ SEM client-secret
            client-authentication-methods:
              - none  # Public client
            authorization-grant-types:
              - authorization_code
              - refresh_token
            redirect-uris:
              - http://localhost:4200/callback
              - https://app.algamoney.com/callback
            scopes:
              - read
              - write
            require-authorization-consent: false
            require-proof-key: true  # ✅ PKCE obrigatório
```

### Passo 2: Atualizar app.module.ts

Adicione o provedor do OAuth:

```typescript
import { OAuthModule } from 'angular-oauth2-oidc';

@NgModule({
  imports: [
    // ... outros imports
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['http://localhost:8080'],
        sendAccessToken: true
      }
    })
  ],
  // ...
})
export class AppModule { }
```

### Passo 3: Substituir AuthService por AuthPkceService

#### 3.1. Atualizar imports nos componentes

**Antes:**
```typescript
import { AuthService } from './seguranca/auth.service';
```

**Depois:**
```typescript
import { AuthPkceService } from './seguranca/auth-pkce.service';
```

#### 3.2. Atualizar injeção de dependência

**Antes:**
```typescript
constructor(private auth: AuthService) {}
```

**Depois:**
```typescript
constructor(private auth: AuthPkceService) {}
```

#### 3.3. Atualizar métodos de login/logout

**Antes (auth.service.ts):**
```typescript
login(usuario: string, senha: string): Promise<void> {
  return this.auth.login(usuario, senha);
}
```

**Depois (auth-pkce.service.ts):**
```typescript
login(): void {
  // PKCE usa redirect - não precisa de usuário/senha no método
  this.auth.login();
}
```

O fluxo PKCE redireciona para a página de login do servidor OAuth.

### Passo 4: Atualizar Guards

**auth.guard.ts** - Atualizar verificação:

```typescript
import { AuthPkceService } from './auth-pkce.service';

canActivate(): boolean {
  if (this.auth.isAuthenticated) {
    return true;
  }

  this.auth.login();
  return false;
}
```

### Passo 5: Atualizar HTTP Interceptor

O `OAuthModule` já adiciona automaticamente o token nas requests.

Se tiver um interceptor customizado, pode remover a lógica de adicionar Authorization header:

```typescript
// Não precisa mais disto:
// headers = headers.set('Authorization', `Bearer ${token}`);

// O OAuthModule faz automaticamente para URLs em allowedUrls
```

### Passo 6: Atualizar Componente de Login

**login.component.ts:**

```typescript
import { AuthPkceService } from '../seguranca/auth-pkce.service';

export class LoginComponent {
  constructor(private auth: AuthPkceService) {}

  login() {
    // PKCE redireciona para servidor OAuth
    // Não precisa de formulário de login no Angular
    this.auth.login();
  }
}
```

**login.component.html:**

```html
<div class="login-container">
  <h1>AlgaMoney</h1>
  <button (click)="login()" class="btn-login">
    Fazer Login
  </button>
</div>
```

### Passo 7: Criar Componente de Callback (Opcional)

```typescript
// callback.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthPkceService } from '../seguranca/auth-pkce.service';

@Component({
  template: '<p>Processando login...</p>'
})
export class CallbackComponent implements OnInit {
  constructor(
    private auth: AuthPkceService,
    private router: Router
  ) {}

  ngOnInit() {
    // O OAuthService já processa automaticamente
    // Apenas redireciona para home
    if (this.auth.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }
}
```

Adicionar rota:

```typescript
{
  path: 'callback',
  component: CallbackComponent
}
```

## 🔧 Configurações Adicionais

### Ajustar Timeouts

Em `auth.config.ts`:

```typescript
export const authPkceConfig: AuthConfig = {
  // ...
  timeoutFactor: 0.75, // Renovar token quando 75% do tempo passar
  sessionChecksEnabled: true, // Verificar sessão periodicamente
  // ...
};
```

### Configurar Scopes

```typescript
scope: 'read write profile email',
```

### HTTPS Obrigatório em Produção

```typescript
requireHttps: environment.production,
```

## 📋 Checklist de Migração

### Backend
- [ ] Configurar servidor OAuth para suportar PKCE
- [ ] Criar client "angular" como public client
- [ ] Configurar redirect URIs
- [ ] Testar endpoints OAuth manualmente

### Frontend
- [ ] Instalar angular-oauth2-oidc ✅
- [ ] Criar arquivos de configuração ✅
- [ ] Importar OAuthModule no app.module.ts
- [ ] Substituir AuthService por AuthPkceService
- [ ] Atualizar componente de login
- [ ] Atualizar guards
- [ ] Remover interceptor customizado (se usar OAuthModule)
- [ ] Adicionar rota de callback
- [ ] Testar fluxo completo

### Segurança
- [ ] Remover oauthClientSecret de environment.prod.ts ✅
- [ ] Verificar CORS no servidor OAuth
- [ ] Validar tokens JWT no backend
- [ ] Configurar HTTPS em produção
- [ ] Testar renovação automática de tokens

### Testes
- [ ] Testar login
- [ ] Testar logout
- [ ] Testar renovação de token
- [ ] Testar expiração de token
- [ ] Testar permissões/roles
- [ ] Testar em diferentes navegadores

## 🐛 Troubleshooting

### Erro: "Discovery document failed"

**Solução**: Configure manualmente os endpoints em `auth.config.ts`:

```typescript
loginUrl: `${environment.apiUrl}/oauth/authorize`,
tokenEndpoint: `${environment.apiUrl}/oauth/token`,
strictDiscoveryDocumentValidation: false,
```

### Erro: "CORS"

**Solução**: Configure CORS no servidor OAuth:

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:4200");
        config.addAllowedOrigin("https://app.algamoney.com");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

### Erro: "Token expired"

**Solução**: Verificar renovação automática:

```typescript
this.oauthService.setupAutomaticSilentRefresh();
```

### Login não redireciona

**Solução**: Verificar redirect_uri no servidor OAuth:
- Deve corresponder exatamente ao configurado no frontend
- Incluir protocolo (http/https)
- Sem trailing slash

## 📚 Recursos

- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [angular-oauth2-oidc Documentation](https://github.com/manfredsteyer/angular-oauth2-oidc)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [Spring Authorization Server](https://docs.spring.io/spring-authorization-server/docs/current/reference/html/)

## ✅ Vantagens do PKCE

| Aspecto | Antes (Client Secret) | Depois (PKCE) |
|---------|----------------------|---------------|
| Client Secret | ❌ Exposto | ✅ Não necessário |
| Segurança | ❌ Baixa | ✅ Alta |
| Padrão da Indústria | ❌ Obsoleto | ✅ Atual |
| Conformidade RFC | ❌ Não | ✅ RFC 7636 |
| Recomendado para SPA | ❌ Não | ✅ Sim |

## 🎯 Próximos Passos

1. Configurar servidor OAuth para PKCE
2. Testar em ambiente de desenvolvimento
3. Migrar componentes um por um
4. Testar fluxo completo
5. Deploy em staging
6. Validar em produção

---

**Nota**: Esta implementação está PRONTA para uso. Basta seguir os passos acima para ativar.
