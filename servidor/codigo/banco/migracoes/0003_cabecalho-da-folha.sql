CREATE TABLE "cabecalho_padrao" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"casa_de_oracao" varchar(10),
	"local" varchar(60),
	"setor" varchar(60),
	"atividades" varchar(60),
	"tipo_de_servico" varchar(20),
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cabecalho_padrao_linha_unica" CHECK ("cabecalho_padrao"."id" = 1),
	CONSTRAINT "cabecalho_padrao_tipo_de_servico_valido" CHECK ("cabecalho_padrao"."tipo_de_servico" IN ('apoio', 'construcao', 'reforma'))
);
--> statement-breakpoint
ALTER TABLE "dias" ADD COLUMN "casa_de_oracao" varchar(10);--> statement-breakpoint
ALTER TABLE "dias" ADD COLUMN "local" varchar(60);--> statement-breakpoint
ALTER TABLE "dias" ADD COLUMN "setor" varchar(60);--> statement-breakpoint
ALTER TABLE "dias" ADD COLUMN "atividades" varchar(60);--> statement-breakpoint
ALTER TABLE "dias" ADD COLUMN "tipo_de_servico" varchar(20);--> statement-breakpoint
ALTER TABLE "dias" ADD CONSTRAINT "dias_tipo_de_servico_valido" CHECK ("dias"."tipo_de_servico" IN ('apoio', 'construcao', 'reforma'));