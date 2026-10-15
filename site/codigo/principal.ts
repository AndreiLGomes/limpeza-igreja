import { bootstrapApplication } from '@angular/platform-browser';
import { Aplicacao } from './aplicacao/aplicacao';
import { configuracao } from './aplicacao/configuracao';

bootstrapApplication(Aplicacao, configuracao).catch((erro) => console.error(erro));
