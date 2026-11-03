/** "/": tela inicial (TelaSemana). Título e o cartão da próxima limpeza. */
import { Component, inject, type OnInit } from '@angular/core';
import { Vazio } from '@componentes';
import { Escala } from '@nucleo/escala';
import { CartaoDoDia } from '../../comum/cartao-do-dia/cartao-do-dia';
import { Estado } from '../../comum/estado/estado';

@Component({
  selector: 'app-tela-semana',
  imports: [CartaoDoDia, Estado, Vazio],
  template: `
    <div class="pagina">
      <h1 class="display">Próxima limpeza</h1>
      <app-estado
        [estado]="escala.estado()"
        [erro]="escala.erro()"
        textoCarregando="Carregando a escala…"
        (tentar)="escala.carregar()"
      >
        @if (escala.proximo(); as dia) {
          <app-cartao-do-dia [dia]="dia" />
        } @else {
          <div class="card">
            <app-vazio
              titulo="Nenhuma limpeza marcada"
              texto="Quando quem organiza cadastrar as próximas limpezas, elas aparecem aqui."
            />
          </div>
        }
      </app-estado>
    </div>
  `,
})
export class TelaSemana implements OnInit {
  protected readonly escala = inject(Escala);

  ngOnInit(): void {
    void this.escala.carregar();
  }
}
