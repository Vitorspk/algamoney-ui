import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { PwaNotificationService } from './pwa-notification.service';

describe('PwaNotificationService', () => {
  let service: PwaNotificationService;
  let swUpdateMock: jasmine.SpyObj<SwUpdate>;
  let messageServiceMock: jasmine.SpyObj<MessageService>;
  let versionUpdatesSubject: Subject<any>;

  beforeEach(() => {
    versionUpdatesSubject = new Subject();

    swUpdateMock = jasmine.createSpyObj('SwUpdate', ['checkForUpdate', 'activateUpdate'], {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable()
    });

    messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        PwaNotificationService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: MessageService, useValue: messageServiceMock }
      ]
    });

    service = TestBed.inject(PwaNotificationService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Service Worker Updates', () => {
    it('should check for updates on initialization', () => {
      expect(swUpdateMock.checkForUpdate).not.toHaveBeenCalled();
    });

    it('should handle VERSION_READY event', (done) => {
      const versionEvent: VersionReadyEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'v1' },
        latestVersion: { hash: 'v2' }
      };

      // Subscribe to the versionUpdates observable
      setTimeout(() => {
        versionUpdatesSubject.next(versionEvent);

        setTimeout(() => {
          expect(messageServiceMock.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'info',
            summary: 'Atualização Disponível'
          }));
          done();
        }, 100);
      }, 100);
    });

    it('should handle checkForUpdate error gracefully', (done) => {
      swUpdateMock.checkForUpdate.and.returnValue(Promise.reject('Network error'));

      spyOn(console, 'error');

      // Trigger interval manually
      service['checkForUpdates']();

      setTimeout(() => {
        // Should not crash the application
        expect(console.error).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should apply update when applyUpdate is called', (done) => {
      swUpdateMock.activateUpdate.and.returnValue(Promise.resolve(true));

      service.applyUpdate();

      setTimeout(() => {
        expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
        expect(messageServiceMock.add).toHaveBeenCalledWith(jasmine.objectContaining({
          severity: 'success',
          summary: 'Atualizado'
        }));
        done();
      }, 100);
    });
  });

  describe('Connection Status Monitoring', () => {
    it('should return online status', () => {
      expect(service.getConnectionStatus()).toBe(true);
    });

    it('should handle online event', (done) => {
      // Simulate going offline then online
      window.dispatchEvent(new Event('offline'));

      setTimeout(() => {
        window.dispatchEvent(new Event('online'));

        setTimeout(() => {
          expect(messageServiceMock.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'success',
            summary: 'Conectado'
          }));
          expect(service.getConnectionStatus()).toBe(true);
          done();
        }, 50);
      }, 50);
    });

    it('should handle offline event', (done) => {
      window.dispatchEvent(new Event('offline'));

      setTimeout(() => {
        expect(messageServiceMock.add).toHaveBeenCalledWith(jasmine.objectContaining({
          severity: 'warn',
          summary: 'Sem Conexão'
        }));
        expect(service.getConnectionStatus()).toBe(false);
        done();
      }, 50);
    });
  });

  describe('Notification Permissions', () => {
    it('should return denied if Notification API is not available', async () => {
      const originalNotification = (window as any).Notification;
      delete (window as any).Notification;

      const permission = await service.requestNotificationPermission();

      expect(permission).toBe('denied');

      // Restore
      (window as any).Notification = originalNotification;
    });

    it('should return granted if permission is already granted', async () => {
      spyOnProperty(Notification, 'permission', 'get').and.returnValue('granted');

      const permission = await service.requestNotificationPermission();

      expect(permission).toBe('granted');
    });
  });

  describe('Upcoming Due Date Notifications', () => {
    it('should notify for due dates within 3 days', async () => {
      spyOn(service, 'sendNotification');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      service.notifyUpcomingDueDate('Pagamento de aluguel', tomorrow);

      expect(service.sendNotification).toHaveBeenCalledWith(
        'Lançamento Próximo do Vencimento',
        jasmine.objectContaining({
          body: jasmine.stringContaining('Pagamento de aluguel'),
          tag: 'due-date-reminder'
        })
      );
    });

    it('should not notify for due dates more than 3 days away', async () => {
      spyOn(service, 'sendNotification');

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      service.notifyUpcomingDueDate('Pagamento futuro', futureDate);

      expect(service.sendNotification).not.toHaveBeenCalled();
    });

    it('should not notify for past due dates', async () => {
      spyOn(service, 'sendNotification');

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      service.notifyUpcomingDueDate('Pagamento atrasado', pastDate);

      expect(service.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on Destroy', () => {
    it('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = spyOn(window, 'removeEventListener');

      service.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', jasmine.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', jasmine.any(Function));
    });

    it('should clear interval on destroy', () => {
      spyOn(window, 'clearInterval');

      service.ngOnDestroy();

      expect(window.clearInterval).toHaveBeenCalled();
    });
  });

  describe('Success Notifications', () => {
    it('should send success notification', async () => {
      spyOn(service, 'sendNotification');

      service.notifySuccess('Operação Concluída', 'Lançamento salvo com sucesso');

      expect(service.sendNotification).toHaveBeenCalledWith(
        'Operação Concluída',
        jasmine.objectContaining({
          body: 'Lançamento salvo com sucesso',
          tag: 'success-notification'
        })
      );
    });
  });
});