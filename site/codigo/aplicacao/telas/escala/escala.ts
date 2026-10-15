/** "/escala": as próximas sextas (S12), um cartão por sexta. */
import { Component, inject, type OnInit } from '@angular/core';
import { Vazio } from '@componentes';
import { Escala } from '@nucleo/escala';
import { CartaoDoDia } from '../../comum/cartao-do-dia/cartao-do-dia';
import { Estado } from '../../comum/estado/estado';

@Component({
  selector: 'app-tela-escala',
  imports: [CartaoDoDia, Estado, Vazio],
  template: `
    <div class="pagina">
      <h1 class="title">Próximas sextas</h1>
      <app-estado
        [estado]="escala.estado()"
        [erro]="escala.erro()"
        textoCarregando="Carregando a escala…"
        (tentar)="escala.carregar()"
      >
        @for (dia of escala.dias(); track dia.id) {
          <app-cartao-do-dia [dia]="dia" />
        } @empty {
          <div class="card">
            <app-vazio
              titulo="Nenhuma sexta marcada"
              texto="Quando quem organiza cadastrar as próximas limpezas, elas aparecem aqui."
            />
          </div>
        }
      </app-estado>
    </div>
  `,
})
export class TelaEscala implements OnInit {
  protected readonly escala = inject(Escala);

  ngOnInit(): void {
    void this.escala.carregar();
  }
}
