import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LogoutService {

  tokensRenokeUrl: string;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.tokensRenokeUrl = `${environment.apiUrl}/tokens/revoke`;
  }

  logout() {
    return firstValueFrom(
      this.http.delete(this.tokensRenokeUrl, { withCredentials: true })
    )
      .then(() => {
        this.limparSessaoCompleta();
      })
      .catch(() => {
        // Mesmo que a API falhe, limpa a sessão local
        this.limparSessaoCompleta();
      });
  }

  private limparSessaoCompleta() {
    // Limpa o token do localStorage
    this.auth.limparAccessToken();
    // Limpa o ID da sessão
    sessionStorage.removeItem('app_session_id');
    // Limpa qualquer outro dado de sessão
    sessionStorage.clear();
  }

}
