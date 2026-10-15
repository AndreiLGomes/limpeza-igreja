import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AreaDeNotificacoes, Barra, Rodape, type AbaDaBarra } from '@componentes';
import { ServicoDeTema } from '@nucleo/tema';

/** Abas da parte pública (docs/06, "Barra superior"). */
const ABAS_PUBLICAS: AbaDaBarra[] = [
  { rotulo: 'Esta semana', rota: '/' },
  { rotulo: 'Escala', rota: '/escala' },
  { rotulo: 'Tarefas', rota: '/tarefas' },
];

/** A tela mais interna da rota atual (onde ficam os `data` da rota). */
function telaAtual(rota: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return rota.firstChild ? telaAtual(rota.firstChild) : rota;
}

@Component({
  selector: 'app-raiz',
  imports: [AreaDeNotificacoes, Barra, Rodape, RouterOutlet],
  template: `
    @if (comMoldura()) {
      <app-barra [abas]="abas" />
    }
    <main class="principal">
      <router-outlet />
    </main>
    @if (comMoldura()) {
      <app-rodape />
    }
    <app-area-de-notificacoes />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .principal {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
  `,
})
export class Aplicacao {
  // Cria o ServicoDeTema logo na abertura, para aplicar o tema antes da primeira tela.
  protected readonly servicoDeTema = inject(ServicoDeTema);
  private readonly roteador = inject(Router);

  protected readonly abas = ABAS_PUBLICAS;

  /** Barra e rodapé aparecem em todas as telas, menos nas que pedem `data: { moldura: false }`. */
  protected readonly comMoldura = toSignal(
    this.roteador.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => telaAtual(this.roteador.routerState.snapshot.root).data['moldura'] !== false),
    ),
    { initialValue: false },
  );
}
