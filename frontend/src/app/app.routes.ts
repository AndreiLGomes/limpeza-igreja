import type { Routes } from '@angular/router';

/** Cada tela é carregada sob demanda. As telas públicas e do organizador entram nas Etapas 7 e 8. */
export const routes: Routes = [
  {
    path: 'design-system',
    title: 'Vitrine do Design System',
    loadComponent: () => import('./features/design-system/design-system').then((m) => m.DesignSystem),
  },
  // Provisório até a Etapa 7 criar a tela inicial.
  { path: '', pathMatch: 'full', redirectTo: 'design-system' },
  { path: '**', redirectTo: '' },
];
