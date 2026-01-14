import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { DashboardService, LancamentoPorCategoria, LancamentoPorDia } from './dashboard.service';
import { ErrorHandlerService } from './../error-handler.service';
import { LogoutService } from './../../seguranca/logout.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceMock: jasmine.SpyObj<DashboardService>;
  let errorHandlerMock: jasmine.SpyObj<ErrorHandlerService>;
  let titleMock: jasmine.SpyObj<Title>;
  let routerMock: jasmine.SpyObj<Router>;
  let logoutServiceMock: jasmine.SpyObj<LogoutService>;
  let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;

  const mockCategoriaData: LancamentoPorCategoria[] = [
    { tipo: 'RECEITA', categoria: { nome: 'Salário' }, total: 5000 },
    { tipo: 'DESPESA', categoria: { nome: 'Aluguel' }, total: 1500 },
    { tipo: 'DESPESA', categoria: { nome: 'Alimentação' }, total: 800 }
  ];

  const mockDiaData: LancamentoPorDia[] = [
    { tipo: 'RECEITA', dia: '2024-01-05', total: 5000 },
    { tipo: 'DESPESA', dia: '2024-01-10', total: 1500 },
    { tipo: 'DESPESA', dia: '2024-01-15', total: 800 }
  ];

  beforeEach(async () => {
    dashboardServiceMock = jasmine.createSpyObj('DashboardService', ['lancamentosPorCategoria', 'lancamentosPorDia']);
    errorHandlerMock = jasmine.createSpyObj('ErrorHandlerService', ['handle']);
    titleMock = jasmine.createSpyObj('Title', ['setTitle']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    logoutServiceMock = jasmine.createSpyObj('LogoutService', ['logout']);
    cdrMock = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    dashboardServiceMock.lancamentosPorCategoria.and.returnValue(Promise.resolve(mockCategoriaData));
    dashboardServiceMock.lancamentosPorDia.and.returnValue(Promise.resolve(mockDiaData));

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: ErrorHandlerService, useValue: errorHandlerMock },
        { provide: Title, useValue: titleMock },
        { provide: Router, useValue: routerMock },
        { provide: LogoutService, useValue: logoutServiceMock },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title on init', () => {
    component.ngOnInit();
    expect(titleMock.setTitle).toHaveBeenCalledWith('Dashboard');
  });

  describe('carregarEstatisticas', () => {
    it('should load statistics and calculate totals', async () => {
      component.carregarEstatisticas();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(component.receitaTotal).toBe(5000);
      expect(component.despesaTotal).toBe(2300); // 1500 + 800
      expect(component.saldo).toBe(2700); // 5000 - 2300
      expect(component.carregando).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      dashboardServiceMock.lancamentosPorCategoria.and.returnValue(Promise.reject('API Error'));

      component.carregarEstatisticas();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorHandlerMock.handle).toHaveBeenCalledWith('API Error');
      expect(component.carregando).toBe(false);
    });

    it('should wait for both promises before setting carregando to false', async () => {
      let resolveCategoria: any;
      let resolveDia: any;

      const categoriaPromise = new Promise(resolve => { resolveCategoria = resolve; });
      const diaPromise = new Promise(resolve => { resolveDia = resolve; });

      dashboardServiceMock.lancamentosPorCategoria.and.returnValue(categoriaPromise as any);
      dashboardServiceMock.lancamentosPorDia.and.returnValue(diaPromise as any);

      component.carregarEstatisticas();

      expect(component.carregando).toBe(true);

      // Resolve apenas uma promise
      resolveCategoria(mockCategoriaData);
      await new Promise(resolve => setTimeout(resolve, 50));

      // carregando ainda deve ser true
      expect(component.carregando).toBe(true);

      // Resolve a segunda promise
      resolveDia(mockDiaData);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Agora deve ser false
      expect(component.carregando).toBe(false);
    });
  });

  describe('configurarGraficoPizza', () => {
    it('should configure pie chart with correct data', () => {
      component.configurarGraficoPizza(mockCategoriaData);

      expect(component.pieChartData).toBeDefined();
      expect(component.pieChartData.labels).toEqual(['Receitas', 'Despesas']);
      expect(component.pieChartData.datasets[0].data).toEqual([5000, 2300]);
    });

    it('should handle empty data', () => {
      component.configurarGraficoPizza([]);

      expect(component.pieChartData).toBeDefined();
      expect(component.pieChartData.datasets[0].data).toEqual([0, 0]);
    });
  });

  describe('configurarGraficoLinha', () => {
    it('should configure line chart with correct structure', () => {
      component.configurarGraficoLinha(mockDiaData);

      expect(component.lineChartData).toBeDefined();
      expect(component.lineChartData.datasets).toHaveSize(2);
      expect(component.lineChartData.datasets[0].label).toBe('Receitas');
      expect(component.lineChartData.datasets[1].label).toBe('Despesas');
    });

    it('should handle empty data', () => {
      component.configurarGraficoLinha([]);

      expect(component.lineChartData).toBeDefined();
      expect(component.lineChartData.datasets).toHaveSize(2);
    });
  });

  describe('totaisPorDia', () => {
    it('should map daily totals correctly', () => {
      const diasDoMes = [1, 2, 3, 4, 5, 10, 15];
      const result = component['totaisPorDia'](mockDiaData, diasDoMes);

      expect(result).toHaveSize(7);
      expect(result[4]).toBe(5000); // dia 5
      expect(result[5]).toBe(1500); // dia 10
      expect(result[6]).toBe(800);  // dia 15
      expect(result[0]).toBe(0);    // dia 1 sem dados
    });

    it('should return zeros for days without data', () => {
      const diasDoMes = [1, 2, 3];
      const result = component['totaisPorDia']([], diasDoMes);

      expect(result).toEqual([0, 0, 0]);
    });
  });

  describe('calcularTotal', () => {
    it('should calculate total correctly', () => {
      const total = component['calcularTotal'](mockCategoriaData);
      expect(total).toBe(7300); // 5000 + 1500 + 800
    });

    it('should return 0 for empty array', () => {
      const total = component['calcularTotal']([]);
      expect(total).toBe(0);
    });
  });

  describe('logout', () => {
    it('should navigate to login on successful logout', async () => {
      logoutServiceMock.logout.and.returnValue(Promise.resolve());

      component.logout();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle logout error', async () => {
      const error = new Error('Logout failed');
      logoutServiceMock.logout.and.returnValue(Promise.reject(error));

      component.logout();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errorHandlerMock.handle).toHaveBeenCalledWith(error);
    });
  });

  describe('Change Detection', () => {
    it('should call markForCheck when loading data', () => {
      component.carregarEstatisticas();

      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });
});