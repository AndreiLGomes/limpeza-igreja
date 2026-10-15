/**
 * "/organizar/entrar": entrada na área de quem organiza, com a senha de organizador (TelaAcesso; O1–O3).
 * A mensagem de senha errada nunca diz se "quase acertou". Depois de 5 erros seguidos, o servidor bloqueia.
 */
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { esquemaEntrar } from '@limpeza/compartilhado';
import {
  AcoesDoFormulario, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Entrada, Formulario, Icone, Notificacoes,
} from '@componentes';
import { validadorZod } from '@formularios';
import { ehSemConexao, mensagemDaFalha, notificarFalha } from '@nucleo/falhas';
import { Organizador } from '@nucleo/organizador';

@Component({
  selector: 'app-tela-entrar',
  imports: [
    AcoesDoFormulario, Botao, CabecalhoDoFormulario, Campo, ConteudoDoBotao, Entrada, Formulario, Icone,
    ReactiveFormsModule, RouterLink,
  ],
  template: `
    <div class="pagina">
      <form appFormulario class="card cartao-de-formulario" [formGroup]="formulario" (ngSubmit)="entrar()">
        <span class="empty__icon"><app-icone nome="lock" [tamanho]="24" /></span>
        <app-cabecalho-do-formulario
          titulo="Área de quem organiza"
          descricao="Para criar sextas, mudar vagas e tarefas. Quem só vem limpar não precisa entrar aqui."
        />
        <app-campo rotulo="Senha de organizador" [controle]="formulario.controls.senha">
          <input appEntrada type="password" autocomplete="current-password" formControlName="senha" />
        </app-campo>
        <div appAcoesDoFormulario>
          <a appBotao variante="discreto" routerLink="/">Voltar</a>
          <button appBotao type="submit" [esperando]="entrando()" [disabled]="entrando()">
            <app-conteudo-do-botao [esperando]="entrando()" textoDeEspera="Entrando…">Entrar</app-conteudo-do-botao>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class TelaEntrar {
  private readonly organizador = inject(Organizador);
  private readonly notificacoes = inject(Notificacoes);
  private readonly roteador = inject(Router);

  protected readonly formulario = new FormGroup({
    senha: new FormControl('', { nonNullable: true, validators: validadorZod(esquemaEntrar.shape.senha) }),
  });
  protected readonly entrando = signal(false);

  protected async entrar(): Promise<void> {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.entrando.set(true);
    try {
      await this.organizador.entrar(this.formulario.controls.senha.value);
      await this.roteador.navigateByUrl('/organizar');
    } catch (erro) {
      if (ehSemConexao(erro)) {
        notificarFalha(this.notificacoes, erro, () => void this.entrar());
      } else {
        // O3: senha incorreta ou muitas tentativas: a mensagem do servidor vai embaixo do campo.
        this.formulario.controls.senha.setErrors({ servidor: mensagemDaFalha(erro) });
      }
    } finally {
      this.entrando.set(false);
    }
  }
}
