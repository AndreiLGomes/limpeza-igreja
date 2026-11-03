import type { Routes } from '@angular/router';
import { exigirOrganizador, quemNaoEntrou } from './nucleo/organizador';

/** Cada tela é carregada sob demanda (docs/06, "Telas e rotas"). */
export const rotas: Routes = [
  // ---------- Parte pública ----------
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
    path: 'presenca',
    title: 'Marcar presença',
    loadComponent: () => import('./telas/presenca/presenca').then((modulo) => modulo.TelaPresenca),
  },

  // ---------- Área de quem organiza (O1–O7) ----------
  {
    path: 'organizar/entrar',
    title: 'Área de quem organiza',
    canActivate: [quemNaoEntrou],
    loadComponent: () => import('./telas/organizar/entrar/entrar').then((modulo) => modulo.TelaEntrar),
  },
  {
    path: 'organizar',
    canActivate: [exigirOrganizador],
    data: { area: 'organizador' },
    children: [
      {
        path: '',
        title: 'Limpezas',
        loadComponent: () => import('./telas/organizar/limpezas/limpezas').then((modulo) => modulo.TelaLimpezas),
      },
      {
        path: 'limpeza/nova',
        title: 'Nova limpeza',
        loadComponent: () => import('./telas/organizar/limpeza/limpeza').then((modulo) => modulo.TelaLimpeza),
      },
      {
        path: 'limpeza/:id',
        title: 'Editar limpeza',
        loadComponent: () => import('./telas/organizar/limpeza/limpeza').then((modulo) => modulo.TelaLimpeza),
      },
    ],
  },

  // ---------- Outras ----------
  {
    path: 'vitrine',
    title: 'Vitrine do Design System',
    // A vitrine mostra a barra e o rodapé como exemplo; não usa a moldura do app.
    data: { moldura: false },
    loadComponent: () => import('./telas/vitrine/vitrine').then((modulo) => modulo.Vitrine),
  },
  { path: '**', redirectTo: '' },
];
