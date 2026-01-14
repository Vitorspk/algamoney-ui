import { Injectable, OnDestroy } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

// Constantes de configuração
const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas
const DUE_DATE_WARNING_DAYS = 3; // Dias de antecedência para notificar vencimento

/**
 * Serviço para gerenciar PWA features:
 * - Notificações de atualização
 * - Status de conexão
 * - Push notifications
 */
@Injectable({
  providedIn: 'root'
})
export class PwaNotificationService implements OnDestroy {

  private isOnline = true;
  private updateCheckInterval: any;
  private onlineHandler: () => void;
  private offlineHandler: () => void;

  constructor(
    private swUpdate: SwUpdate,
    private messageService: MessageService
  ) {
    this.checkForUpdates();
    this.monitorConnectionStatus();
  }

  /**
   * Cleanup ao destruir o serviço
   */
  ngOnDestroy(): void {
    // Limpa interval de checagem de atualizações
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Remove event listeners
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  /**
   * Verifica se há atualizações disponíveis do Service Worker
   */
  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker não está habilitado');
      return;
    }

    // Escuta por novas versões disponíveis
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map(evt => ({
          type: 'UPDATE_AVAILABLE',
          current: evt.currentVersion,
          available: evt.latestVersion,
        }))
      )
      .subscribe(() => {
        this.notifyUpdateAvailable();
      });

    // Verifica atualizações periodicamente com error handling
    if (this.swUpdate.isEnabled) {
      this.updateCheckInterval = setInterval(() => {
        this.swUpdate.checkForUpdate()
          .then(() => {
            console.log('Verificação de atualização concluída');
          })
          .catch(err => {
            console.error('Erro ao verificar atualizações:', err);
          });
      }, UPDATE_CHECK_INTERVAL);
    }
  }

  /**
   * Notifica o usuário sobre atualização disponível
   */
  private notifyUpdateAvailable(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Atualização Disponível',
      detail: 'Uma nova versão está disponível. Clique para atualizar.',
      sticky: true,
      closable: true,
      data: {
        action: () => this.applyUpdate()
      }
    });
  }

  /**
   * Aplica a atualização disponível
   */
  applyUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Atualizado',
          detail: 'A aplicação será recarregada...'
        });

        setTimeout(() => {
          document.location.reload();
        }, 1000);
      });
    }
  }

  /**
   * Monitora o status de conexão com a internet
   */
  private monitorConnectionStatus(): void {
    // Armazena os handlers para poder removê-los no ngOnDestroy
    this.onlineHandler = () => {
      this.isOnline = true;
      this.messageService.add({
        severity: 'success',
        summary: 'Conectado',
        detail: 'Conexão com a internet restabelecida',
        life: 3000
      });
    };

    this.offlineHandler = () => {
      this.isOnline = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Sem Conexão',
        detail: 'Você está trabalhando em modo offline',
        sticky: true
      });
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  /**
   * Retorna o status atual da conexão
   */
  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Solicita permissão para notificações push
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Envia uma notificação push local
   */
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestNotificationPermission();

    if (permission === 'granted') {
      const notificationOptions: any = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        ...options
      };

      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);
      } else {
        new Notification(title, notificationOptions);
      }
    }
  }

  /**
   * Envia notificação quando um lançamento está próximo do vencimento
   */
  notifyUpcomingDueDate(descricao: string, dataVencimento: Date): void {
    const daysUntilDue = Math.ceil((dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= DUE_DATE_WARNING_DAYS && daysUntilDue >= 0) {
      this.sendNotification('Lançamento Próximo do Vencimento', {
        body: `${descricao} vence em ${daysUntilDue} dia(s)`,
        tag: 'due-date-reminder',
        requireInteraction: true
      } as any);
    }
  }

  /**
   * Envia notificação de sucesso para operações
   */
  notifySuccess(title: string, message: string): void {
    this.sendNotification(title, {
      body: message,
      tag: 'success-notification',
      icon: '/icons/icon-192x192.png'
    });
  }
}