import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiUrl: string;
  oauthClientId: string;
}

/**
 * Serviço para carregar configurações em runtime
 * As credenciais sensíveis são obtidas via variáveis de ambiente do servidor
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Carrega configurações do arquivo env.json
   * Deve ser chamado no APP_INITIALIZER
   */
  async loadConfig(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<AppConfig>('/assets/config/env.json')
      );
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Fallback para valores padrão de desenvolvimento
      this.config = {
        apiUrl: 'http://localhost:8080',
        oauthClientId: 'angular'
      };
    }
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configurações não foram carregadas. Chame loadConfig() primeiro.');
    }
    return this.config;
  }

  get apiUrl(): string {
    return this.getConfig().apiUrl;
  }

  get oauthClientId(): string {
    return this.getConfig().oauthClientId;
  }

  /**
   * OAuth Client Secret deve ser obtido do backend
   * NUNCA armazene no frontend
   */
  get oauthClientSecret(): string {
    // Em produção, este valor vem do backend durante o login
    // Para desenvolvimento local, use uma variável de ambiente
    const secret = (window as any).__ENV?.OAUTH_CLIENT_SECRET;
    if (!secret) {
      console.warn('OAUTH_CLIENT_SECRET não configurado. Use variáveis de ambiente.');
      return ''; // Retorna vazio para forçar erro de autenticação
    }
    return secret;
  }
}