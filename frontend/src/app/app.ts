import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/theme';
import { ToastArea } from '@ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastArea],
  template: `
    <router-outlet />
    <app-toast-area />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
  `,
})
export class App {
  // Cria o ThemeService logo na abertura, para aplicar o tema antes da primeira tela.
  protected readonly tema = inject(ThemeService);
}
