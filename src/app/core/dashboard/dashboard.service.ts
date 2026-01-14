import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from './../../../environments/environment';

export interface LancamentoPorCategoria {
  tipo: 'RECEITA' | 'DESPESA';
  categoria: { nome: string };
  total: number;
}

export interface LancamentoPorDia {
  tipo: 'RECEITA' | 'DESPESA';
  dia: string;
  total: number;
}

export interface EstatisticasDashboard {
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
  receitaPorCategoria: LancamentoPorCategoria[];
  despesaPorCategoria: LancamentoPorCategoria[];
  receitasPorDia: LancamentoPorDia[];
  despesasPorDia: LancamentoPorDia[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  lancamentosUrl: string;

  constructor(private http: HttpClient) {
    this.lancamentosUrl = `${environment.apiUrl}/lancamentos`;
  }

  lancamentosPorCategoria(): Promise<Array<LancamentoPorCategoria>> {
    return firstValueFrom(
      this.http.get<Array<LancamentoPorCategoria>>(`${this.lancamentosUrl}/estatisticas/por-categoria`)
    );
  }

  lancamentosPorDia(): Promise<Array<LancamentoPorDia>> {
    return firstValueFrom(
      this.http.get<Array<LancamentoPorDia>>(`${this.lancamentosUrl}/estatisticas/por-dia`)
    );
  }

  buscarEstatisticas(mesReferencia: Date): Promise<EstatisticasDashboard> {
    const params = new HttpParams()
      .set('mesReferencia', this.formatarData(mesReferencia));

    return firstValueFrom(
      this.http.get<EstatisticasDashboard>(`${this.lancamentosUrl}/estatisticas`, { params })
    );
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}