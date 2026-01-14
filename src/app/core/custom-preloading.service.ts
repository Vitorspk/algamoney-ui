import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Estratégia de preloading personalizada que:
 * 1. Só faz preload de rotas marcadas com preload: true
 * 2. Adiciona um delay para não impactar o carregamento inicial
 * 3. Permite priorização de módulos
 */
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingService implements PreloadingStrategy {

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Só faz preload se a rota estiver marcada explicitamente
    if (route.data && route.data['preload']) {
      const delay = route.data['delay'] || 1000; // Delay padrão de 1 segundo

      console.log(`Preloading: ${route.path} com delay de ${delay}ms`);

      // Aguarda o delay antes de carregar o módulo
      return timer(delay).pipe(
        mergeMap(() => load())
      );
    }

    // Não faz preload
    return of(null);
  }
}