import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dadosIniciais = JSON.parse(
  fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf8")
);

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function criarMapaIds(registros = []) {
  const idsNumericos = registros
    .map((registro) => Number(registro.id))
    .filter((id) => Number.isInteger(id) && id > 0);
  let proximoId = Math.max(0, ...idsNumericos) + 1;
  const mapa = new Map();

  for (const registro of registros) {
    const idOriginal = String(registro.id);
    const idNumerico = Number(registro.id);
    const idFinal = Number.isInteger(idNumerico) && idNumerico > 0
      ? idNumerico
      : proximoId++;
    mapa.set(idOriginal, idFinal);
  }
  return mapa;
}

function mapearReferencia(mapa, id) {
  if (id === null || id === undefined || id === "") return null;
  return mapa.get(String(id)) ?? (Number(id) || null);
}

function dataOuNula(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

const mapas = {
  setores: criarMapaIds(dadosIniciais.setores),
  localizacoes: criarMapaIds(dadosIniciais.localizacoes),
  fornecedores: criarMapaIds(dadosIniciais.fornecedores),
  equipamentos: criarMapaIds(dadosIniciais.equipamentos),
  manutencoes: criarMapaIds(dadosIniciais.manutencoes),
  tarefas: criarMapaIds(dadosIniciais.tarefas),
};

async function main() {
  await prisma.$transaction(async (tx) => {
    // A carga inicial recria os dados. Execute apenas em um banco novo/vazio.
    await tx.tarefa.deleteMany();
    await tx.manutencao.deleteMany();
    await tx.equipamento.deleteMany();
    await tx.localizacao.deleteMany();
    await tx.fornecedor.deleteMany();
    await tx.setor.deleteMany();

    await tx.setor.createMany({
      data: dadosIniciais.setores.map((item) => ({
        id: mapas.setores.get(String(item.id)),
        nome: item.nome,
        descricao: item.descricao ?? null,
        status: item.status ?? null,
      })),
    });

    await tx.fornecedor.createMany({
      data: dadosIniciais.fornecedores.map((item) => ({
        id: mapas.fornecedores.get(String(item.id)),
        nomeFantasia: item.nomeFantasia,
        razaoSocial: item.razaoSocial ?? null,
        cnpj: item.cnpj ?? null,
        endereco: item.endereco ?? null,
        telefone: item.telefone ?? null,
        email: item.email ?? null,
        descricao: item.descricao ?? null,
        status: item.status ?? null,
      })),
    });

    await tx.localizacao.createMany({
      data: dadosIniciais.localizacoes.map((item) => ({
        id: mapas.localizacoes.get(String(item.id)),
        nome: item.nome,
        setorId: mapearReferencia(mapas.setores, item.setorId),
        descricao: item.descricao ?? null,
        status: item.status ?? null,
      })),
    });

    await tx.equipamento.createMany({
      data: dadosIniciais.equipamentos.map((item) => ({
        id: mapas.equipamentos.get(String(item.id)),
        patrimonio: item.patrimonio,
        nome: item.nome,
        tipo: item.tipo ?? null,
        marca: item.marca ?? null,
        modelo: item.modelo ?? null,
        numeroSerie: item.numeroSerie ?? null,
        setorId: mapearReferencia(mapas.setores, item.setorId),
        localizacaoId: mapearReferencia(mapas.localizacoes, item.localizacaoId),
        fornecedorId: mapearReferencia(mapas.fornecedores, item.fornecedorId),
        status: item.status ?? null,
        observacao: item.observacao ?? null,
        notaFiscal: item.notaFiscal ?? null,
        valor: item.valor === "" || item.valor === undefined ? null : item.valor,
        dataAquisicao: dataOuNula(item.dataAquisicao),
        garantia: dataOuNula(item.garantia),
      })),
    });

    await tx.manutencao.createMany({
      data: dadosIniciais.manutencoes.map((item) => ({
        id: mapas.manutencoes.get(String(item.id)),
        equipamentoId: mapearReferencia(mapas.equipamentos, item.equipamentoId),
        tipoManutencao: item.tipoManutencao ?? null,
        data: dataOuNula(item.data),
        descricaoProblema: item.descricaoProblema ?? null,
        observacao: item.observacao ?? null,
        prioridade: item.prioridade ?? null,
        solicitante: item.solicitante ?? null,
        status: item.status ?? null,
      })),
    });

    await tx.tarefa.createMany({
      data: dadosIniciais.tarefas.map((item) => ({
        id: mapas.tarefas.get(String(item.id)),
        manutencaoId: mapearReferencia(mapas.manutencoes, item.manutencaoId),
        descricao: item.descricao,
        dataCriacao: dataOuNula(item.dataCriacao),
      })),
    });

    // Atualiza as sequências após importar IDs explícitos do JSON original.
    for (const tabela of ["setores", "localizacoes", "fornecedores", "equipamentos", "manutencoes", "tarefas"]) {
      await tx.$queryRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('${tabela}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabela}), 1))`
      );
    }
  });

  console.log("Carga inicial concluída com sucesso.");
  for (const [nome, mapa] of Object.entries(mapas)) {
    console.log(`- ${nome}: ${mapa.size} registros`);
  }
}

main()
  .catch((erro) => {
    console.error("Falha ao importar os dados iniciais:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
