ALTER TABLE "confirmacoes" ALTER COLUMN "telefone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "numero_adesao" varchar(6);--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "codigo_funcao" varchar(6);--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "recebeu_epi" boolean;--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "entrada" time;--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "saida" time;--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD COLUMN "assinado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_adesao_so_digitos" CHECK ("confirmacoes"."numero_adesao" ~ '^[0-9]{1,6}$');--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_codigo_funcao_so_digitos" CHECK ("confirmacoes"."codigo_funcao" ~ '^[0-9]{1,6}$');--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_saida_depois_da_entrada" CHECK ("confirmacoes"."saida" IS NULL OR ("confirmacoes"."entrada" IS NOT NULL AND "confirmacoes"."saida" >= "confirmacoes"."entrada"));--> statement-breakpoint
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_assinatura_com_saida" CHECK ("confirmacoes"."assinado_em" IS NULL OR "confirmacoes"."saida" IS NOT NULL);