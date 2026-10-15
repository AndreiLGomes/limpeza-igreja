import type { Routes } from '@angular/router';

/** Cada tela é carregada sob demanda. As telas públicas e do organizador entram nas Etapas 7 e 8. */
export const rotas: Routes = [
  {
    path: 'vitrine',
    title: 'Vitrine do Design System',
    loadComponent: () => import('./telas/vitrine/vitrine').then((modulo) => modulo.Vitrine),
  },
  // Provisório até a Etapa 7 criar a tela inicial.
  { path: '', pathMatch: 'full', redirectTo: 'vitrine' },
  { path: '**', redirectTo: '' },
];
