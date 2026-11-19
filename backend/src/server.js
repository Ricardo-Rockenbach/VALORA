import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db/prisma.js";
import { criarCrudRouter } from "./routes/crudRoutes.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const origensPermitidas = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origem) => origem.trim())
  : true;

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", banco: "conectado" });
});

for (const entidade of [
  "equipamentos",
  "setores",
  "localizacoes",
  "fornecedores",
  "manutencoes",
  "tarefas",
]) {
  app.use(`/${entidade}`, criarCrudRouter(entidade));
}

app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` });
});

app.use((erro, _req, res, _next) => {
  console.error("Erro na API:", erro);

  if (erro.code === "P2025") {
    return res.status(404).json({ erro: "Registro não encontrado." });
  }
  if (erro.code === "P2002") {
    return res.status(409).json({ erro: "Já existe um registro com esses dados únicos." });
  }
  if (erro.code === "P2003") {
    return res.status(400).json({ erro: "Não é possível realizar a operação porque há registros relacionados." });
  }

  const status = Number(erro.status) || 500;
  return res.status(status).json({
    erro: status === 500 ? "Erro interno na API." : erro.message,
  });
});

const servidor = app.listen(PORT, "0.0.0.0", () => {
  console.log(`VALORA API disponível em http://localhost:${PORT}`);
});

async function encerrar() {
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
