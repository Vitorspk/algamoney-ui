import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from './../../environments/environment';

describe('AuthService - Security Tests', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Limpa localStorage antes de cada teste
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('Security: Session Management', () => {
    it('should create new session ID on initialization', () => {
      const sessionId = sessionStorage.getItem('app_session_id');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^\d+$/); // Deve ser um timestamp numérico
    });

    it('should clear token when starting new session', () => {
      // Simula token existente de sessão anterior
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('token_created_at', '1234567890');
      sessionStorage.removeItem('app_session_id');

      // Cria novo serviço (nova sessão)
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token_created_at')).toBeNull();
    });
  });

  describe('Security: Token Expiration', () => {
    it('should consider token invalid when older than 24 hours', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjo5OTk5OTk5OTk5fQ.0';
      const oneDayAgo = new Date().getTime() - (25 * 60 * 60 * 1000); // 25 horas atrás

      localStorage.setItem('token', token);
      localStorage.setItem('token_created_at', oneDayAgo.toString());

      expect(service.isAccessTokenInvalido()).toBe(true);
    });

    it('should consider token valid when less than 24 hours old', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.0';
      const oneHourAgo = new Date().getTime() - (1 * 60 * 60 * 1000);

      localStorage.setItem('token', validToken);
      localStorage.setItem('token_created_at', oneHourAgo.toString());

      // Mock do jwtHelper para não validar assinatura
      (service as any).jwtPayload = { authorities: ['ROLE_USER'] };

      expect(service.isAccessTokenInvalido()).toBe(false);
    });

    it('should consider token invalid when not present', () => {
      localStorage.removeItem('token');
      expect(service.isAccessTokenInvalido()).toBe(true);
    });
  });

  describe('Security: Login', () => {
    it('should send credentials with proper encoding in login', (done) => {
      const usuario = 'test@example.com';
      const senha = 'password123';

      service.login(usuario, senha).then(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.body).toContain('username=test@example.com');
      expect(req.request.body).toContain('password=password123');
      expect(req.request.body).toContain('grant_type=password');

      req.flush({ access_token: 'mock-token' });
    });

    it('should handle invalid credentials gracefully', (done) => {
      service.login('wrong', 'credentials').catch(error => {
        expect(error).toBe('Usuário ou senha inválida!');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      req.flush({ error: 'invalid_grant' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should store token with timestamp on successful login', (done) => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIl19.0';

      service.login('user', 'pass').then(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(localStorage.getItem('token_created_at')).toBeTruthy();

        const createdAt = parseInt(localStorage.getItem('token_created_at')!, 10);
        const now = new Date().getTime();
        expect(now - createdAt).toBeLessThan(1000); // Criado há menos de 1 segundo

        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      req.flush({ access_token: mockToken });
    });
  });

  describe('Security: Token Refresh', () => {
    it('should use refresh_token grant type for token renewal', (done) => {
      service.obterNovoAccessToken().then(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toContain('grant_type=refresh_token');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ access_token: 'new-token' });
    });

    it('should handle refresh token failure gracefully', (done) => {
      service.obterNovoAccessToken().then(() => {
        // Não deve rejeitar a promise, apenas resolve vazio
        expect(true).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      req.flush({ error: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Security: Token Cleanup', () => {
    it('should clear all token data on logout', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('token_created_at', '123456');
      (service as any).jwtPayload = { authorities: ['ROLE_USER'] };

      service.limparAccessToken();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token_created_at')).toBeNull();
      expect(service.jwtPayload).toBeNull();
    });
  });

  describe('Security: Permission Checks', () => {
    beforeEach(() => {
      (service as any).jwtPayload = {
        authorities: ['ROLE_CADASTRAR_LANCAMENTO', 'ROLE_PESQUISAR_LANCAMENTO']
      };
    });

    it('should correctly identify user permissions', () => {
      expect(service.temPermissao('ROLE_CADASTRAR_LANCAMENTO')).toBe(true);
      expect(service.temPermissao('ROLE_REMOVER_LANCAMENTO')).toBe(false);
    });

    it('should correctly check for any permission in list', () => {
      expect(service.temQualquerPermissao(['ROLE_CADASTRAR_LANCAMENTO', 'ROLE_ADMIN'])).toBe(true);
      expect(service.temQualquerPermissao(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])).toBe(false);
    });

    it('should return false when no JWT payload exists', () => {
      (service as any).jwtPayload = null;
      expect(service.temPermissao('ROLE_CADASTRAR_LANCAMENTO')).toBe(false);
      expect(service.temQualquerPermissao(['ROLE_ADMIN'])).toBe(false);
    });
  });

  describe('Security: Credentials in Requests', () => {
    it('should always send credentials with withCredentials flag', (done) => {
      service.login('user', 'pass').then(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ access_token: 'token' });
    });

    it('should use Basic Auth header with base64 encoded credentials', (done) => {
      service.login('user', 'pass').then(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/oauth/token`);
      const authHeader = req.request.headers.get('Authorization');

      expect(authHeader).toBeTruthy();
      expect(authHeader).toMatch(/^Basic [A-Za-z0-9+/=]+$/);

      req.flush({ access_token: 'token' });
    });
  });
});