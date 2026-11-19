-- CreateTable
CREATE TABLE "setores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localizacoes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "setor_id" INTEGER NOT NULL,
    "descricao" TEXT,
    "status" TEXT,

    CONSTRAINT "localizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "razao_social" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "descricao" TEXT,
    "status" TEXT,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "numero_serie" TEXT,
    "setor_id" INTEGER,
    "localizacao_id" INTEGER,
    "fornecedor_id" INTEGER,
    "status" TEXT,
    "observacao" TEXT,
    "nota_fiscal" TEXT,
    "valor" DOUBLE PRECISION,
    "data_aquisicao" DATE,
    "garantia" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "tipo_manutencao" TEXT,
    "data" DATE,
    "descricao_problema" TEXT,
    "observacao" TEXT,
    "prioridade" TEXT,
    "solicitante" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" SERIAL NOT NULL,
    "manutencao_id" INTEGER,
    "descricao" TEXT NOT NULL,
    "data_criacao" DATE,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "setores_status_idx" ON "setores"("status");

-- CreateIndex
CREATE INDEX "localizacoes_setor_id_idx" ON "localizacoes"("setor_id");

-- CreateIndex
CREATE INDEX "localizacoes_status_idx" ON "localizacoes"("status");

-- CreateIndex
CREATE INDEX "fornecedores_nome_fantasia_idx" ON "fornecedores"("nome_fantasia");

-- CreateIndex
CREATE INDEX "fornecedores_status_idx" ON "fornecedores"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_patrimonio_key" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE INDEX "equipamentos_setor_id_idx" ON "equipamentos"("setor_id");

-- CreateIndex
CREATE INDEX "equipamentos_localizacao_id_idx" ON "equipamentos"("localizacao_id");

-- CreateIndex
CREATE INDEX "equipamentos_fornecedor_id_idx" ON "equipamentos"("fornecedor_id");

-- CreateIndex
CREATE INDEX "equipamentos_status_idx" ON "equipamentos"("status");

-- CreateIndex
CREATE INDEX "manutencoes_equipamento_id_idx" ON "manutencoes"("equipamento_id");

-- CreateIndex
CREATE INDEX "manutencoes_status_idx" ON "manutencoes"("status");

-- CreateIndex
CREATE INDEX "manutencoes_data_idx" ON "manutencoes"("data");

-- CreateIndex
CREATE INDEX "tarefas_manutencao_id_idx" ON "tarefas"("manutencao_id");

-- AddForeignKey
ALTER TABLE "localizacoes" ADD CONSTRAINT "localizacoes_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_localizacao_id_fkey" FOREIGN KEY ("localizacao_id") REFERENCES "localizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
