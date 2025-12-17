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
    ).then(() => {
      this.auth.limparAccessToken();
    });
  }

}
