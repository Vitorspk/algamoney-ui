import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Pessoa } from './../core/model';
import { environment } from './../../environments/environment';

export class PessoaFiltro {
  nome: string;
  pagina = 0;
  itensPorPagina = 5;
}

@Injectable()
export class PessoaService {

  pessoasUrl: string;

  constructor(private http: HttpClient) {
    this.pessoasUrl = `${environment.apiUrl}/pessoas`;
  }

  pesquisar(filtro: PessoaFiltro): Promise<any> {
    let params = new HttpParams()
      .set('page', filtro.pagina.toString())
      .set('size', filtro.itensPorPagina.toString());

    if (filtro.nome) {
      params = params.set('nome', filtro.nome);
    }

    return firstValueFrom(
      this.http.get<any>(this.pessoasUrl, { params })
    )
      .then(responseJson => {
        const pessoas = responseJson.content;

        const resultado = {
          pessoas,
          total: responseJson.totalElements
        };

        return resultado;
      })
  }

  listarTodas(): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(this.pessoasUrl)
    )
      .then(response => response.content);
  }

  excluir(codigo: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.pessoasUrl}/${codigo}`)
    );
  }

  mudarStatus(codigo: number, ativo: boolean): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.pessoasUrl}/${codigo}/ativo`, ativo)
    );
  }

  adicionar(pessoa: Pessoa): Promise<Pessoa> {
    return firstValueFrom(
      this.http.post<Pessoa>(this.pessoasUrl, pessoa)
    );
  }

  atualizar(pessoa: Pessoa): Promise<Pessoa> {
    return firstValueFrom(
      this.http.put<Pessoa>(`${this.pessoasUrl}/${pessoa.codigo}`, pessoa)
    );
  }

  buscarPorCodigo(codigo: number): Promise<Pessoa> {
    return firstValueFrom(
      this.http.get<Pessoa>(`${this.pessoasUrl}/${codigo}`)
    );
  }

}
