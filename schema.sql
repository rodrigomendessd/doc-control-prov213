-- doc-control: Sistema de Controle de Documentos — Prov. 213/2026 CNJ
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE papel_usuario    AS ENUM ('TI', 'Titular', 'Admin');
CREATE TYPE tipo_documento   AS ENUM ('PSI', 'POP', 'Politica', 'Manual', 'Formulario', 'Outros');
CREATE TYPE status_documento AS ENUM ('Rascunho', 'Revisao_TI', 'Aguardando_Aprovacao', 'Aprovado', 'Obsoleto');
CREATE TYPE status_aprovacao AS ENUM ('Pendente', 'Aprovado', 'Rejeitado');

CREATE TABLE usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  papel      papel_usuario NOT NULL DEFAULT 'TI',
  ativo      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT NOT NULL,
  tipo            tipo_documento NOT NULL,
  status          status_documento NOT NULL DEFAULT 'Rascunho',
  codigo_artigo   TEXT,
  criado_por      UUID REFERENCES usuarios(id),
  versao_atual_id UUID,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE versoes_documento (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id  UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  numero_versao TEXT NOT NULL,
  conteudo_md   TEXT NOT NULL,
  hash_conteudo TEXT NOT NULL,
  alteracoes    TEXT,
  criado_por    UUID REFERENCES usuarios(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documentos
  ADD CONSTRAINT fk_versao_atual
  FOREIGN KEY (versao_atual_id) REFERENCES versoes_documento(id);

CREATE TABLE aprovacoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao_id    UUID NOT NULL REFERENCES versoes_documento(id) ON DELETE CASCADE,
  nivel        INTEGER NOT NULL CHECK (nivel IN (1, 2)),
  aprovador_id UUID REFERENCES usuarios(id),
  status       status_aprovacao NOT NULL DEFAULT 'Pendente',
  comentario   TEXT,
  data         TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id               BIGSERIAL PRIMARY KEY,
  tabela           TEXT NOT NULL,
  registro_id      UUID,
  acao             TEXT NOT NULL,
  usuario_id       UUID REFERENCES usuarios(id),
  dados_anteriores JSONB,
  dados_novos      JSONB,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documentos_atualizado_em
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE INDEX idx_documentos_status    ON documentos(status);
CREATE INDEX idx_documentos_tipo      ON documentos(tipo);
CREATE INDEX idx_versoes_doc_id       ON versoes_documento(documento_id);
CREATE INDEX idx_aprovacoes_versao_id ON aprovacoes(versao_id);
CREATE INDEX idx_aprovacoes_status    ON aprovacoes(status);
