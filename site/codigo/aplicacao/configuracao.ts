import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { type ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { TituloDaAba } from '@nucleo/titulo';
import { rotas } from './rotas';

registerLocaleData(localePt);

export const configuracao: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    // withComponentInputBinding: "?dia=ID" chega como input() da tela (docs/06).
    provideRouter(rotas, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: TituloDaAba },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
