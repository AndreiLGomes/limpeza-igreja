CREATE TABLE "confirmacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"dia_id" uuid NOT NULL,
	"nome" varchar(80) NOT NULL,
	"telefone" varchar(11) NOT NULL,
	"tempo" varchar(20) NOT NULL,
	"observacao" varchar(200),
	"codigo_cancelamento_hash" varchar NOT NULL,
	CONSTRAINT "confirmacoes_telefone_unico_no_dia" UNIQUE("dia_id","telefone"),
	CONSTRAINT "confirmacoes_codigo_unico" UNIQUE("codigo_cancelamento_hash"),
	CONSTRAINT "confirmacoes_nome_tamanho" CHECK (char_length("confirmacoes"."nome") BETWEEN 3 AND 80),
	CONSTRAINT "confirmacoes_telefone_so_digitos" CHECK ("confirmacoes"."telefone" ~ '^[0-9]{10,11}$'),
	CONSTRAINT "confirmacoes_tempo_valido" CHECK ("confirmacoes"."tempo" IN ('todo', 'primeira-hora'))
);
--> statement-breakpoint
CREATE TABLE "dias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"data" date NOT NULL,
	"inicio" time NOT NULL,
	"fim" time NOT NULL,
	"vagas" smallint NOT NULL,
	CONSTRAINT "dias_data_unica" UNIQUE("data"),
	CONSTRAINT "dias_fim_depois_do_inicio" CHECK ("dias"."fim" > "dias"."inicio"),
	CONSTRAINT "dias_vagas_validas" CHECK ("dias"."vagas" BETWEEN 1 AND 30)
);
--> statement-breakpoint
CREATE TABLE "sessoes_organizador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"token_hash" varchar NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	CONSTRAINT "sessoes_token_unico" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"dia_id" uuid NOT NULL,
	"nome" varchar(80) NOT NULL,
	"ordem" smallint NOT NULL,
	"feita" boolean DEFAULT false NOT NULL,
	"feita_em" timestamp with time zone,
	CONSTRAINT "tarefas_nome_unico_no_dia" UNIQUE("dia_id","nome"),
	CONSTRAINT "tarefas_nome_tamanho" CHECK (char_length("tarefas"."nome") BETWEEN 1 AND 80)
);
--> statement-breakpoint
CREATE TABLE "tentativas_login" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"chave" varchar NOT NULL,
	CONSTRAINT "tentativas_tipo_valido" CHECK ("tentativas_login"."tipo" IN ('senha', 'cancelamento'))
);
--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_dia_id_dias_id_fk" FOREIGN KEY ("dia_id") REFERENCES "public"."dias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_dia_id_dias_id_fk" FOREIGN KEY ("dia_id") REFERENCES "public"."dias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confirmacoes_dia_id_idx" ON "confirmacoes" USING btree ("dia_id");--> statement-breakpoint
CREATE INDEX "tarefas_dia_id_idx" ON "tarefas" USING btree ("dia_id");--> statement-breakpoint
CREATE INDEX "tentativas_busca_idx" ON "tentativas_login" USING btree ("tipo","chave","criado_em");