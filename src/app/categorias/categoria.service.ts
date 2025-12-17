import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from './../../environments/environment';

@Injectable()
export class CategoriaService {

  categoriasUrl: string;

  constructor(
    private http: HttpClient
  ) {
    this.categoriasUrl = `${environment.apiUrl}/categorias`;
  }

  listarTodas(): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(this.categoriasUrl)
    );
  }

}
