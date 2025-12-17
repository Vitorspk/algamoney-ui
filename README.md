# AlgaMoney UI

Financial management system built with Angular 18.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Docker Setup](#docker-setup)
- [Build](#build)
- [Testing](#testing)
- [Migration History](#migration-history)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

AlgaMoney UI is a comprehensive financial management application that provides features for:

- User authentication and authorization
- Financial transactions (Lancamentos) management
- Person/Contact (Pessoas) management
- Dashboard and reporting
- Role-based access control

## Tech Stack

### Core Framework
- **Angular**: 18.2.0
- **TypeScript**: 5.4.5
- **RxJS**: 7.8.1
- **Node.js**: 20.x LTS (required)
- **NPM**: 10.x or higher

### UI Library
- **PrimeNG**: 17.18.0 (components)
- **PrimeFlex**: Grid system
- **Font Awesome**: 4.7.0 (icons)

### Authentication
- **@auth0/angular-jwt**: 5.2.0
- HTTP Interceptor pattern for token management
- OAuth2 with refresh token support

### Other Libraries
- **ngx-currency**: 18.0.0 (currency mask)
- **Moment.js**: 2.18.1 (date handling)

## Prerequisites

- **Node.js**: 20.x or higher
- **NPM**: 10.x or higher
- **Docker**: (optional, for containerized deployment)
- **Docker Compose**: (optional)

## Installation

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts in some libraries.

### Environment Configuration

The application expects an API backend. Configure the API URL in:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

## Development

### Development Server

Start the development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you change source files.

### Code Generation

Generate new components, services, or modules:

```bash
# Generate component
ng generate component component-name

# Generate service
ng generate service service-name

# Generate module
ng generate module module-name
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## Docker Setup

### Quick Start with Docker Compose

The easiest way to run the application in a container:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f algamoney-ui

# Stop
docker-compose down
```

The application will be available at `http://localhost:4200`

### Docker Architecture

```
/
├── Dockerfile                   # Multi-stage build definition
├── docker-compose.yml          # Container orchestration
└── .docker/
    ├── nginx/
    │   ├── nginx.conf          # Nginx global configuration
    │   └── default.conf        # Server configuration
    └── scripts/
        └── entrypoint.sh       # Container startup script
```

### Multi-Stage Docker Build

The Dockerfile uses a multi-stage build approach:

1. **Build Stage**: Node.js 20 Alpine
   - Installs dependencies
   - Runs production build
   - Optimizes bundle

2. **Runtime Stage**: Nginx 1.25 Alpine
   - Serves static files
   - Configured for Angular routing
   - Gzip compression enabled
   - Security headers configured
   - Final image size: ~50MB

### Build Docker Image

```bash
docker build -t algamoney-ui:latest .
```

### Run Container Manually

```bash
docker run -d \
  --name algamoney-ui \
  -p 4200:80 \
  -e ENVIRONMENT=production \
  algamoney-ui:latest
```

### Health Check

Health endpoint: `http://localhost:4200/health`

Check health status:

```bash
curl http://localhost:4200/health
```

### Docker Configuration

#### Environment Variables

Configure via `docker-compose.yml`:

```yaml
environment:
  - ENVIRONMENT=production
  - API_URL=http://your-backend:8080
```

#### Nginx Configuration

- **nginx.conf**: Global settings (gzip, headers, performance)
- **default.conf**: Server settings (routing, caching, proxy)

Features:
- ✅ Gzip compression (60-80% size reduction)
- ✅ Cache strategies (1 year for assets, no-cache for HTML)
- ✅ Security headers (X-Frame-Options, XSS Protection)
- ✅ Angular SPA routing support
- ✅ Health check endpoint

### Docker Commands Reference

```bash
# View running containers
docker ps

# View logs
docker logs -f algamoney-ui

# Access container shell
docker exec -it algamoney-ui sh

# Restart container
docker restart algamoney-ui

# Remove container
docker rm -f algamoney-ui

# Remove image
docker rmi algamoney-ui:latest

# Rebuild without cache
docker-compose build --no-cache
```

## Build

### Production Build

Build the project for production:

```bash
npm run build
# or
ng build
```

Build artifacts will be stored in the `dist/` directory.

### Build Statistics

```
Initial chunk files   | Names         |  Raw size | Estimated transfer size
main-J2K4EHCT.js      | main          | 890.34 kB |               194.37 kB
styles-5VBJF76Y.css   | styles        | 183.63 kB |                18.83 kB
polyfills-EONH2QZO.js | polyfills     |  34.54 kB |                11.32 kB

                      | Initial total |   1.11 MB |               224.52 kB
```

### Build Optimizations

The Angular 18 build uses:
- **ESBuild**: 10x faster than webpack
- **Ivy Rendering Engine**: Up to 40% faster runtime
- **Tree-shaking**: Removes unused code
- **Code splitting**: Lazy loading support
- **Minification**: CSS and JS optimization

## Testing

### Unit Tests

Run unit tests via Karma:

```bash
npm test
# or
ng test
```

### End-to-End Tests

Run end-to-end tests:

```bash
npm run e2e
# or
ng e2e
```

### Security Audit

Check for known vulnerabilities:

```bash
npm audit
npm audit fix
```

## Migration History

This project was successfully migrated from **Angular 4.0.0** (March 2017) to **Angular 18.2.0** (2024).

### Major Changes

#### Framework Updates
- Angular 4.0.0 → 18.2.0 (14 major versions)
- TypeScript 2.3.4 → 5.4.5
- RxJS 5.1.0 → 7.8.1

#### Library Replacements
- `@angular/http` → `@angular/common/http` (HttpClient)
- `angular2-jwt` → `@auth0/angular-jwt` (JWT with interceptor pattern)
- `ng2-toasty` → `primeng/toast` (MessageService)
- `ng2-currency-mask` → `ngx-currency`
- PrimeNG 4.1.0 → 17.18.0

#### Code Modernization
- HTTP service migration to HttpClient
- RxJS operators: `.toPromise()` → `firstValueFrom()`
- AuthHttp wrapper → HTTP Interceptor
- PrimeNG tables: `p-dataTable` → `p-table` with ng-templates
- Build system: webpack → esbuild
- Linting: tslint → eslint

### Performance Improvements

- **Build speed**: 10x faster with ESBuild
- **Runtime performance**: 40% improvement with Ivy
- **Bundle size**: Optimized tree-shaking
- **Development experience**: Hot Module Replacement (HMR) with Vite

## Project Structure

```
algamoney-ui/
├── src/
│   ├── app/
│   │   ├── core/                    # Core module (global services, navbar)
│   │   │   ├── error-handler.service.ts
│   │   │   ├── navbar/
│   │   │   └── core.module.ts
│   │   ├── lancamentos/             # Financial transactions module
│   │   │   ├── lancamento.service.ts
│   │   │   ├── lancamentos-pesquisa/
│   │   │   ├── lancamento-cadastro/
│   │   │   └── lancamentos.module.ts
│   │   ├── pessoas/                 # Persons/Contacts module
│   │   │   ├── pessoa.service.ts
│   │   │   ├── pessoas-pesquisa/
│   │   │   ├── pessoa-cadastro/
│   │   │   └── pessoas.module.ts
│   │   ├── seguranca/               # Security/Auth module
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── money-http.ts        # HTTP Interceptor
│   │   │   ├── login/
│   │   │   └── seguranca.module.ts
│   │   ├── shared/                  # Shared components
│   │   │   └── message/
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── environments/
│   │   ├── environment.ts           # Development config
│   │   └── environment.prod.ts      # Production config
│   ├── assets/                      # Static assets
│   ├── styles.css                   # Global styles
│   ├── main.ts                      # Application entry point
│   └── polyfills.ts                 # Browser polyfills
├── .docker/                         # Docker configuration
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── default.conf
│   └── scripts/
│       └── entrypoint.sh
├── Dockerfile
├── docker-compose.yml
├── angular.json                     # Angular CLI configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.js                 # ESLint configuration
├── package.json
└── README.md
```

### Module Overview

#### Core Module
- Global services (error handler, authentication)
- Navigation bar
- Application-wide components

#### Lancamentos (Transactions) Module
- Transaction search with filters and pagination
- Transaction create/edit forms
- Transaction service with API integration
- Date and currency handling

#### Pessoas (Persons) Module
- Person search with filters and pagination
- Person create/edit forms
- Address management
- Active/inactive status toggle

#### Seguranca (Security) Module
- Login component
- Authentication service with JWT
- HTTP interceptor for token management
- Route guards
- Logout service

#### Shared Module
- Reusable components (message, form validators)
- Shared directives
- Common utilities

## Key Features

### Authentication & Authorization
- OAuth2 authentication flow
- JWT token management
- Refresh token support
- HTTP interceptor for automatic token injection
- Route guards with role-based access
- Automatic token renewal

### Financial Transactions
- Create, read, update, delete operations
- Advanced search with filters:
  - Description
  - Due date range
  - Payment date
- Pagination support
- Export functionality
- Transaction types: Revenue/Expense
- Category assignment
- Person/payee association

### Person Management
- CRUD operations for contacts
- Address management
- Active/inactive status
- Search and filter
- Pagination

### UI/UX Features
- Responsive design with PrimeFlex grid
- Toast notifications for user feedback
- Confirmation dialogs
- Form validation with error messages
- Loading indicators
- Currency mask input
- Date picker components
- Dropdown with search/filter

## API Integration

The application expects a REST API backend with the following endpoints:

### Authentication
- `POST /oauth/token` - Login and token generation
- `POST /tokens/revoke` - Logout and token revocation

### Transactions
- `GET /lancamentos` - Search transactions (with filters)
- `GET /lancamentos/:id` - Get transaction by ID
- `POST /lancamentos` - Create transaction
- `PUT /lancamentos/:id` - Update transaction
- `DELETE /lancamentos/:id` - Delete transaction

### Persons
- `GET /pessoas` - Search persons (with filters)
- `GET /pessoas/:id` - Get person by ID
- `POST /pessoas` - Create person
- `PUT /pessoas/:id` - Update person
- `DELETE /pessoas/:id` - Delete person
- `PUT /pessoas/:id/ativo` - Toggle active status

### Categories
- `GET /categorias` - List all categories

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Ensure all tests pass
4. Run linting: `npm run lint`
5. Commit with descriptive message
6. Push to your branch
7. Create a pull request

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Useful Commands

```bash
# Development
npm start                    # Start dev server
npm run build               # Production build
npm test                    # Run tests
npm run lint                # Lint code

# Docker
docker-compose up -d        # Start containers
docker-compose down         # Stop containers
docker-compose logs -f      # View logs

# Version info
ng version                  # Angular CLI version
node --version              # Node.js version
npm --version               # NPM version

# Security
npm audit                   # Check vulnerabilities
npm audit fix               # Fix vulnerabilities
```

## Troubleshooting

### Port 4200 already in use

```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9

# Or use different port
ng serve --port 4300
```

### Docker daemon not running

```bash
# Start Docker Desktop
# Then verify:
docker --version
```

### npm install fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

## Documentation

- [Angular Documentation](https://angular.dev)
- [Angular CLI](https://angular.dev/tools/cli)
- [PrimeNG Components](https://primeng.org)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## License

This project is private and proprietary.

---

**Built with Angular 18** | **Migrated from Angular 4** | **Dockerized** | **Production Ready**
