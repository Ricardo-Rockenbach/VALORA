# VALORA

Sistema de gestão e acompanhamento da saúde de equipamentos, desenvolvido como projeto da disciplina **Gestão Ágil de Projetos**.

O VALORA reúne informações dos ativos em um só lugar, permitindo consultar equipamentos, acompanhar indicadores e registrar manutenções.

## Objetivo

Facilitar o acompanhamento do estado dos equipamentos e do histórico de intervenções, apoiando uma gestão mais organizada e baseada em indicadores.

## Funcionalidades do MVP

- Dashboard com visão geral dos equipamentos e indicadores.
- Consulta e listagem de equipamentos.
- Visualização dos detalhes de cada ativo.
- Pontuação de saúde do equipamento.
- Histórico de manutenções.
- Registro de novas manutenções e intervenções.
- Atualização dos indicadores conforme as regras do MVP.

## Tecnologias

- React
- Vite
- React Router
- CSS
- Node.js + Express — API REST
- PostgreSQL no Neon — banco de dados
- Prisma ORM — modelagem e acesso aos dados

## Como executar

### Pré-requisitos

- Node.js 20.19 ou superior e npm instalados.
- Git instalado.

### 1. Clonar o repositório

```bash
git clone https://github.com/Ricardo-Rockenbach/VALORA.git
cd VALORA
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar o banco Neon e iniciar a API

Crie um projeto PostgreSQL no [Neon](https://console.neon.tech/), copie a URL pooled para `DATABASE_URL` e a URL direta para `DIRECT_URL` no arquivo `backend/.env` (use `backend/.env.example` como modelo). Em seguida, execute:

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

O `db:seed` importa os dados iniciais da API fake e deve ser executado somente em banco novo/vazio. Para detalhes, consulte `backend/README.md`.

A API ficará disponível em:

```text
http://localhost:3000
```

### 4. Iniciar a aplicação

Em outro terminal, dentro da pasta do projeto:

```bash
npm run dev
```

O Vite exibirá o endereço local da aplicação — normalmente:

```text
http://localhost:5173
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run server` | Inicia a API Express (com dependências do backend instaladas) |
| `npm run server:fake` | Inicia a API antiga com JSON Server para testes temporários |
| `npm run build` | Gera a versão de produção |
| `npm run preview` | Executa uma prévia da build |
| `npm run lint` | Executa a análise estática do código |

## Estrutura do projeto

```text
VALORA/
├── backend/           # API Express, Prisma, schema e seed do Neon
├── VALORA-API-FAKE/   # Backup da API fake / dados originais
├── public/            # Arquivos públicos
├── src/               # Código da aplicação React
├── index.html
├── package.json
└── vite.config.js
```

## Status

Projeto acadêmico em desenvolvimento. O escopo atual está concentrado na entrega do MVP e na demonstração do fluxo principal de gestão dos equipamentos.

## Equipe

Projeto desenvolvido para a disciplina **Gestão Ágil de Projetos**.
