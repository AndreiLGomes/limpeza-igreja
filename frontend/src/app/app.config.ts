import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { type ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { TituloDaAba } from '@core/titulo';
import { routes } from './app.routes';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: "?dia=ID" chega como input() da tela (docs/06).
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: TituloDaAba },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
