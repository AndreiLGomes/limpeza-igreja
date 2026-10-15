import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { type ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { interceptadorDoOrganizador } from '@nucleo/organizador';
import { TituloDaAba } from '@nucleo/titulo';
import { rotas } from './rotas';

registerLocaleData(localePt);

export const configuracao: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // O interceptador põe o token nos endereços do organizador (docs/06).
    provideHttpClient(withFetch(), withInterceptors([interceptadorDoOrganizador])),
    // withComponentInputBinding: "?dia=ID" chega como input() da tela (docs/06).
    provideRouter(rotas, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: TituloDaAba },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
