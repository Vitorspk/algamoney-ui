import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './seguranca/auth.service';
import { PwaNotificationService } from './core/pwa-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private router: Router,
    private auth: AuthService,
    private pwaNotification: PwaNotificationService
  ) {}

  ngOnInit() {
    // Inicializa PWA features (service worker, notificações, status de conexão)
    // O serviço se auto-inicializa no construtor

    // Verifica se o token está expirado ao inicializar o app
    // Isso garante que quando a aplicação for reiniciada, o usuário será forçado a fazer login novamente
    const rotaAtual = this.router.url;

    // Se não está na tela de login e o token é inválido, redireciona para login
    if (rotaAtual !== '/login' && this.auth.isAccessTokenInvalido()) {
      this.auth.limparAccessToken();
      this.router.navigate(['/login']);
    }
  }

  exibindoNavbar() {
    return this.router.url !== '/login';
  }

}
