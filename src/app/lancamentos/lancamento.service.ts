import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Lancamento } from './../core/model';
import { environment } from './../../environments/environment';

export class LancamentoFiltro {
  descricao: string;
  dataVencimentoInicio: Date;
  dataVencimentoFim: Date;
  pagina = 0;
  itensPorPagina = 5;
}

@Injectable()
export class LancamentoService {

  lancamentosUrl: string;

  constructor(private http: HttpClient) {
    this.lancamentosUrl = `${environment.apiUrl}/lancamentos`;
  }

  pesquisar(filtro: LancamentoFiltro): Promise<any> {
    let params = new HttpParams()
      .set('page', filtro.pagina.toString())
      .set('size', filtro.itensPorPagina.toString());

    if (filtro.descricao) {
      params = params.set('descricao', filtro.descricao);
    }

    if (filtro.dataVencimentoInicio) {
      params = params.set('dataVencimentoDe',
        this.formatDate(filtro.dataVencimentoInicio));
    }

    if (filtro.dataVencimentoFim) {
      params = params.set('dataVencimentoAte',
        this.formatDate(filtro.dataVencimentoFim));
    }

    return firstValueFrom(
      this.http.get<any>(`${this.lancamentosUrl}?resumo`, { params })
    )
      .then(responseJson => {
        const lancamentos = responseJson.content;

        const resultado = {
          lancamentos,
          total: responseJson.totalElements
        };

        return resultado;
      });
  }

  excluir(codigo: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.lancamentosUrl}/${codigo}`)
    );
  }

  adicionar(lancamento: Lancamento): Promise<Lancamento> {
    return firstValueFrom(
      this.http.post<Lancamento>(this.lancamentosUrl, lancamento)
    );
  }

  atualizar(lancamento: Lancamento): Promise<Lancamento> {
    return firstValueFrom(
      this.http.put<Lancamento>(`${this.lancamentosUrl}/${lancamento.codigo}`, lancamento)
    )
      .then(lancamentoAlterado => {
        this.converterStringsParaDatas([lancamentoAlterado]);
        return lancamentoAlterado;
      });
  }

  buscarPorCodigo(codigo: number): Promise<Lancamento> {
    return firstValueFrom(
      this.http.get<Lancamento>(`${this.lancamentosUrl}/${codigo}`)
    )
      .then(lancamento => {
        this.converterStringsParaDatas([lancamento]);
        return lancamento;
      });
  }

  private converterStringsParaDatas(lancamentos: Lancamento[]) {
    for (const lancamento of lancamentos) {
      if (lancamento.dataVencimento) {
        lancamento.dataVencimento = new Date(lancamento.dataVencimento);
      }

      if (lancamento.dataPagamento) {
        lancamento.dataPagamento = new Date(lancamento.dataPagamento);
      }
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
