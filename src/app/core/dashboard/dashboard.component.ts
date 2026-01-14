import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { DashboardService, LancamentoPorCategoria, LancamentoPorDia } from './dashboard.service';
import { ErrorHandlerService } from './../error-handler.service';
import { LogoutService } from './../../seguranca/logout.service';

// Interfaces para Chart.js
interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string | string[];
  hoverBackgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
  tension?: number;
}

interface PieChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface LineChartData {
  labels: number[];
  datasets: ChartDataset[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  receitaTotal = 0;
  despesaTotal = 0;
  saldo = 0;

  pieChartData: PieChartData;
  lineChartData: LineChartData;

  carregando = true;
  dataAtual = new Date();

  constructor(
    private dashboardService: DashboardService,
    private errorHandler: ErrorHandlerService,
    private title: Title,
    private router: Router,
    private logoutService: LogoutService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.title.setTitle('Dashboard');
    this.configurarGraficoPizza();
    this.configurarGraficoLinha();
    this.carregarEstatisticas();
  }

  carregarEstatisticas() {
    this.carregando = true;
    this.cdr.markForCheck();

    // Carrega ambas as chamadas em paralelo e só remove loading quando ambas terminarem
    Promise.all([
      this.dashboardService.lancamentosPorCategoria()
        .then(dados => {
          // A API retorna um array com todos os lançamentos
          // Vamos calcular o total somando todos
          this.receitaTotal = this.calcularTotal(dados.filter((d: any) => d.tipo === 'RECEITA'));
          this.despesaTotal = this.calcularTotal(dados.filter((d: any) => d.tipo === 'DESPESA'));
          this.saldo = this.receitaTotal - this.despesaTotal;

          this.configurarGraficoPizza(dados);
        })
        .catch(erro => {
          this.errorHandler.handle(erro);
        }),

      this.dashboardService.lancamentosPorDia()
        .then(dados => {
          this.configurarGraficoLinha(dados);
        })
        .catch(erro => {
          this.errorHandler.handle(erro);
        })
    ])
      .finally(() => {
        this.carregando = false;
        this.cdr.markForCheck();
      });
  }

  private calcularTotal(dados: LancamentoPorCategoria[]): number {
    return dados.reduce((total, item) => total + item.total, 0);
  }

  configurarGraficoPizza(dados: LancamentoPorCategoria[] = []) {
    const receitas = dados.filter(d => d.tipo === 'RECEITA');
    const despesas = dados.filter(d => d.tipo === 'DESPESA');

    this.pieChartData = {
      labels: ['Receitas', 'Despesas'],
      datasets: [
        {
          data: [
            this.calcularTotal(receitas),
            this.calcularTotal(despesas)
          ],
          backgroundColor: ['#10b981', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#dc2626']
        }
      ]
    };
  }

  configurarGraficoLinha(dados: LancamentoPorDia[] = []) {
    const diasDoMes = this.configurarDiasMes();

    const receitasPorDia = this.totaisPorDia(
      dados.filter(d => d.tipo === 'RECEITA'),
      diasDoMes
    );

    const despesasPorDia = this.totaisPorDia(
      dados.filter(d => d.tipo === 'DESPESA'),
      diasDoMes
    );

    this.lineChartData = {
      labels: diasDoMes,
      datasets: [
        {
          label: 'Receitas',
          data: receitasPorDia,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Despesas',
          data: despesasPorDia,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private configurarDiasMes(): number[] {
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();

    const dias: number[] = [];
    for (let i = 1; i <= diasNoMes; i++) {
      dias.push(i);
    }
    return dias;
  }

  private totaisPorDia(dados: LancamentoPorDia[], diasDoMes: number[]): number[] {
    // Otimização: usa Map para O(n) em vez de loop aninhado O(n²)
    const totaisPorDiaMap = new Map<number, number>();

    // Primeiro passa pelos dados e armazena no Map (O(n))
    for (const dado of dados) {
      const diaLancamento = new Date(dado.dia).getDate();
      totaisPorDiaMap.set(diaLancamento, dado.total);
    }

    // Depois cria o array de totais consultando o Map (O(n))
    return diasDoMes.map(dia => totaisPorDiaMap.get(dia) || 0);
  }

  logout() {
    this.logoutService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(erro => this.errorHandler.handle(erro));
  }
}