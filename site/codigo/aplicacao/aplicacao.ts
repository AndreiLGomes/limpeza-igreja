import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, type ActivatedRouteSnapshot, type Data } from '@angular/router';
import { filter, map } from 'rxjs';
import { AreaDeNotificacoes, Barra, Rodape, type AbaDaBarra } from '@componentes';
import { Organizador } from '@nucleo/organizador';
import { ServicoDeTema } from '@nucleo/tema';

/** Abas da parte pública (docs/06, "Barra superior"). */
const ABAS_PUBLICAS: AbaDaBarra[] = [
  { rotulo: 'Esta semana', rota: '/' },
  { rotulo: 'Escala', rota: '/escala' },
  { rotulo: 'Tarefas', rota: '/tarefas' },
];

/** Abas da área de quem organiza; "Sair" fica no rodapé (TelaOrganizar). */
const ABAS_DO_ORGANIZADOR: AbaDaBarra[] = [
  { rotulo: 'Limpezas', rota: '/organizar' },
  { rotulo: 'Ver como todos', rota: '/' },
];

/** Junta os `data` da rota inteira, da raiz até a tela atual (a tela mais interna vence). */
function dadosDaRota(rota: ActivatedRouteSnapshot | null, juntos: Data = {}): Data {
  return rota ? dadosDaRota(rota.firstChild, { ...juntos, ...rota.data }) : juntos;
}

@Component({
  selector: 'app-raiz',
  imports: [AreaDeNotificacoes, Barra, Rodape, RouterOutlet],
  template: `
    @if (dados()['moldura'] !== false) {
      @if (naAreaDoOrganizador()) {
        <app-barra [abas]="abasDoOrganizador" etiqueta="Organizador" />
      } @else {
        <app-barra [abas]="abasPublicas" />
      }
    }
    <main class="principal">
      <router-outlet />
    </main>
    @if (dados()['moldura'] !== false) {
      <app-rodape [organizador]="naAreaDoOrganizador()" (sair)="organizador.sair()" />
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
  protected readonly organizador = inject(Organizador);
  private readonly roteador = inject(Router);

  protected readonly abasPublicas = ABAS_PUBLICAS;
  protected readonly abasDoOrganizador = ABAS_DO_ORGANIZADOR;

  /**
   * Os `data` da rota atual. Até a primeira navegação, `moldura: false` evita mostrar a barra errada.
   * - `moldura: false`: sem barra e rodapé (a vitrine);
   * - `area: 'organizador'`: barra e rodapé da área de quem organiza.
   */
  protected readonly dados = toSignal(
    this.roteador.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => dadosDaRota(this.roteador.routerState.snapshot.root)),
    ),
    { initialValue: { moldura: false } as Data },
  );

  protected readonly naAreaDoOrganizador = computed(() => this.dados()['area'] === 'organizador');
}
