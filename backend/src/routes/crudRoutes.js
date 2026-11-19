import { Router } from "express";
import { prisma } from "../db/prisma.js";

const configuracoes = {
  equipamentos: {
    model: prisma.equipamento,
    dateFields: ["dataAquisicao", "garantia"],
    numberFields: ["setorId", "localizacaoId", "fornecedorId"],
    decimalFields: ["valor"],
  },
  setores: {
    model: prisma.setor,
    dateFields: [],
    numberFields: [],
    decimalFields: [],
  },
  localizacoes: {
    model: prisma.localizacao,
    dateFields: [],
    numberFields: ["setorId"],
    decimalFields: [],
  },
  fornecedores: {
    model: prisma.fornecedor,
    dateFields: [],
    numberFields: [],
    decimalFields: [],
  },
  manutencoes: {
    model: prisma.manutencao,
    dateFields: ["data"],
    numberFields: ["equipamentoId"],
    decimalFields: [],
  },
  tarefas: {
    model: prisma.tarefa,
    dateFields: ["dataCriacao"],
    numberFields: ["manutencaoId"],
    decimalFields: [],
  },
};

function converterData(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const texto = String(valor).slice(0, 10);
  const data = new Date(`${texto}T00:00:00.000Z`);
  if (Number.isNaN(data.getTime())) {
    const erro = new Error(`Data inválida: ${valor}`);
    erro.status = 400;
    throw erro;
  }
  return data;
}

function converterNumero(valor, campo) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    const erro = new Error(`O campo ${campo} precisa ser numérico.`);
    erro.status = 400;
    throw erro;
  }
  return numero;
}

function prepararDados(entidade, corpo = {}) {
  const config = configuracoes[entidade];
  const dados = { ...corpo };
  delete dados.id;
  delete dados.createdAt;
  delete dados.updatedAt;

  for (const campo of config.dateFields) {
    if (Object.hasOwn(dados, campo)) dados[campo] = converterData(dados[campo]);
  }
  for (const campo of config.numberFields) {
    if (Object.hasOwn(dados, campo)) dados[campo] = converterNumero(dados[campo], campo);
  }
  for (const campo of config.decimalFields) {
    if (Object.hasOwn(dados, campo)) dados[campo] = converterNumero(dados[campo], campo);
  }

  return dados;
}

function serializar(registro, entidade) {
  if (!registro) return registro;
  const saida = { ...registro };
  for (const campo of configuracoes[entidade].dateFields) {
    if (saida[campo] instanceof Date) {
      saida[campo] = saida[campo].toISOString().slice(0, 10);
    }
  }
  // Não expõe campos internos de auditoria ao frontend legado.
  delete saida.createdAt;
  delete saida.updatedAt;
  return saida;
}

function validarId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    const erro = new Error("Identificador inválido.");
    erro.status = 400;
    throw erro;
  }
  return id;
}

export function criarCrudRouter(entidade) {
  const router = Router();
  const { model } = configuracoes[entidade];

  router.get("/", async (req, res) => {
    const where = {};

    // Filtro usado pela tela de detalhes da manutenção.
    if (entidade === "tarefas" && req.query.manutencaoId !== undefined) {
      where.manutencaoId = converterNumero(req.query.manutencaoId, "manutencaoId");
    }

    const registros = await model.findMany({ where, orderBy: { id: "asc" } });
    res.json(registros.map((registro) => serializar(registro, entidade)));
  });

  router.get("/:id", async (req, res) => {
    const id = validarId(req.params.id);
    const registro = await model.findUnique({ where: { id } });
    if (!registro) return res.status(404).json({ erro: `${entidade} não encontrado(a).` });
    return res.json(serializar(registro, entidade));
  });

  router.post("/", async (req, res) => {
    const dados = prepararDados(entidade, req.body);
    const registro = await model.create({ data: dados });
    return res.status(201).json(serializar(registro, entidade));
  });

  router.patch("/:id", async (req, res) => {
    const id = validarId(req.params.id);
    const dados = prepararDados(entidade, req.body);
    const registro = await model.update({ where: { id }, data: dados });
    return res.json(serializar(registro, entidade));
  });

  // Mantém compatibilidade com o antigo serviço de manutenção que usa PUT.
  router.put("/:id", async (req, res) => {
    const id = validarId(req.params.id);
    const dados = prepararDados(entidade, req.body);
    const registro = await model.update({ where: { id }, data: dados });
    return res.json(serializar(registro, entidade));
  });

  router.delete("/:id", async (req, res) => {
    const id = validarId(req.params.id);
    await model.delete({ where: { id } });
    return res.status(204).send();
  });

  return router;
}
