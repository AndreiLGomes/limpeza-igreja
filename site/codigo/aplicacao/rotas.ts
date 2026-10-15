import type { Routes } from '@angular/router';

/** Cada tela é carregada sob demanda (docs/06, "Telas e rotas"). A área do organizador entra na Etapa 8. */
export const rotas: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Esta semana',
    loadComponent: () => import('./telas/semana/semana').then((modulo) => modulo.TelaSemana),
  },
  {
    path: 'escala',
    title: 'Escala',
    loadComponent: () => import('./telas/escala/escala').then((modulo) => modulo.TelaEscala),
  },
  {
    path: 'tarefas',
    title: 'Tarefas',
    loadComponent: () => import('./telas/tarefas/tarefas').then((modulo) => modulo.TelaTarefas),
  },
  {
    path: 'confirmar',
    title: 'Confirmar presença',
    loadComponent: () => import('./telas/confirmar/confirmar').then((modulo) => modulo.TelaConfirmar),
  },
  {
    path: 'vitrine',
    title: 'Vitrine do Design System',
    // A vitrine mostra a barra e o rodapé como exemplo; não usa a moldura do app.
    data: { moldura: false },
    loadComponent: () => import('./telas/vitrine/vitrine').then((modulo) => modulo.Vitrine),
  },
  { path: '**', redirectTo: '' },
];
