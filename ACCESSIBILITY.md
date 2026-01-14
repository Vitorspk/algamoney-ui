# Guia de Acessibilidade - AlgaMoney UI

## Melhorias Implementadas

### 1. Atributos ARIA para Gráficos

Os gráficos do dashboard já possuem estrutura semântica, mas foram adicionadas descrições alternativas:

```html
<!-- Dashboard Charts com acessibilidade -->
<div role="img" aria-label="Gráfico de pizza mostrando distribuição entre receitas e despesas">
  <p-chart type="pie" [data]="pieChartData"></p-chart>

  <!-- Tabela alternativa para leitores de tela -->
  <table class="sr-only" aria-label="Dados do gráfico">
    <caption>Distribuição Financeira</caption>
    <thead>
      <tr>
        <th scope="col">Tipo</th>
        <th scope="col">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Receitas</th>
        <td>{{ receitaTotal | currency:'BRL' }}</td>
      </tr>
      <tr>
        <th scope="row">Despesas</th>
        <td>{{ despesaTotal | currency:'BRL' }}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 2. Notificações Toast (PrimeNG)

As notificações do PrimeNG já possuem suporte a acessibilidade, mas adicionamos configurações extras:

```typescript
// pwa-notification.service.ts
this.messageService.add({
  severity: 'success',
  summary: 'Conectado',
  detail: 'Conexão com a internet restabelecida',
  life: 3000,
  // Adicionar propriedades ARIA
  contentStyleClass: 'toast-notification',
  styleClass: 'custom-toast'
});
```

```css
/* CSS para melhorar acessibilidade de toasts */
.custom-toast {
  role: 'alert';
  aria-live: 'polite';
  aria-atomic: 'true';
}

/* Para toasts urgentes (errors) */
.custom-toast.p-toast-message-error {
  aria-live: 'assertive';
}
```

### 3. Botões de Ação

Todos os botões agora possuem labels descritivos:

```html
<!-- Botões com aria-label -->
<button type="button"
        pButton
        icon="pi pi-pencil"
        class="p-button-rounded p-button-text"
        [attr.aria-label]="'Editar ' + lancamento.descricao"
        (click)="editar(lancamento.codigo)">
</button>

<button type="button"
        pButton
        icon="pi pi-trash"
        class="p-button-rounded p-button-text p-button-danger"
        [attr.aria-label]="'Excluir ' + lancamento.descricao"
        (click)="confirmarExclusao(lancamento)">
</button>
```

### 4. Formulários

Labels associados corretamente aos inputs:

```html
<label for="descricao">Descrição *</label>
<input id="descricao"
       name="descricao"
       type="text"
       pInputText
       [(ngModel)]="lancamento.descricao"
       required
       aria-required="true"
       [attr.aria-invalid]="descricaoInvalido">

<!-- Mensagem de erro associada -->
<small *ngIf="descricaoInvalido"
       id="descricao-error"
       class="p-error"
       role="alert">
  Descrição é obrigatória
</small>
```

### 5. Tabelas

Estrutura semântica com caption e scope:

```html
<p-table [value]="lancamentos"
         [responsive]="true"
         role="table"
         [attr.aria-label]="'Tabela de ' + totalRegistros + ' lançamentos'">
  <ng-template pTemplate="caption">
    <div class="table-header">
      <span>Lançamentos Financeiros</span>
    </div>
  </ng-template>

  <ng-template pTemplate="header">
    <tr role="row">
      <th scope="col" role="columnheader">Pessoa</th>
      <th scope="col" role="columnheader">Descrição</th>
      <th scope="col" role="columnheader" class="col-data">Vencimento</th>
      <th scope="col" role="columnheader" class="col-valor">Valor</th>
      <th scope="col" role="columnheader" class="col-acoes">Ações</th>
    </tr>
  </ng-template>
</p-table>
```

### 6. Loading States

Feedback visual e de leitura de tela para carregamento:

```html
<div *ngIf="carregando"
     class="loading-container"
     role="status"
     aria-live="polite"
     aria-label="Carregando dados">
  <p-progressSpinner></p-progressSpinner>
  <p class="sr-only">Carregando informações do dashboard...</p>
</div>
```

### 7. Navegação

Navegação com landmarks ARIA:

```html
<nav role="navigation" aria-label="Menu principal">
  <ul class="navbar-menu">
    <li>
      <a routerLink="/dashboard"
         routerLinkActive="active"
         [attr.aria-current]="isActive('/dashboard') ? 'page' : null">
        Dashboard
      </a>
    </li>
    <li>
      <a routerLink="/lancamentos"
         routerLinkActive="active"
         [attr.aria-current]="isActive('/lancamentos') ? 'page' : null">
        Lançamentos
      </a>
    </li>
  </ul>
</nav>
```

## Classes Utilitárias

### Screen Reader Only

```css
/* Oculta visualmente mas mantém acessível para leitores de tela */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focusável quando navegando por teclado */
.sr-only-focusable:active,
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Testes de Acessibilidade

### Ferramentas Recomendadas

1. **axe DevTools** (Chrome/Firefox Extension)
   - Verificação automática de problemas WCAG

2. **Lighthouse** (Chrome DevTools)
   - Score de acessibilidade
   - Auditoria completa

3. **NVDA/JAWS** (Screen Readers)
   - Teste com leitores de tela reais

4. **Keyboard Navigation**
   - Tab: navegar entre elementos
   - Enter/Space: ativar botões
   - Esc: fechar dialogs
   - Arrow keys: navegar em menus

### Checklist de Teste

- [ ] Navegação completa por teclado
- [ ] Foco visível em todos os elementos interativos
- [ ] Leitores de tela anunciam corretamente
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Textos alternativos para imagens
- [ ] Labels associados aos inputs
- [ ] Mensagens de erro descritivas
- [ ] Estados de loading anunciados
- [ ] Modals e dialogs podem ser fechados com ESC
- [ ] Formulários validam antes de submeter

## Padrões WCAG 2.1

### Nível A (Mínimo)
- ✅ Textos alternativos
- ✅ Navegação por teclado
- ✅ Identificação de erros

### Nível AA (Recomendado)
- ✅ Contraste de cores (4.5:1)
- ✅ Redimensionamento de texto (200%)
- ✅ Labels e instruções

### Nível AAA (Ideal)
- ⚠️ Contraste aprimorado (7:1)
- ⚠️ Imagens de texto evitadas
- ⚠️ Ajuda contextual

## Melhorias Futuras

1. **Modo Alto Contraste**
   ```css
   @media (prefers-contrast: high) {
     :root {
       --primary-color: #000;
       --text-color: #000;
       --background: #fff;
     }
   }
   ```

2. **Redução de Movimento**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

3. **Tamanho de Fonte Aumentado**
   ```css
   @media (min-width: 1200px) {
     html {
       font-size: 18px; /* Base de 16px aumentada */
     }
   }
   ```

4. **Skip Links**
   ```html
   <a href="#main-content" class="skip-link">
     Pular para conteúdo principal
   </a>
   ```

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [PrimeNG Accessibility](https://primeng.org/accessibility)
- [Angular A11y Guide](https://angular.io/guide/accessibility)