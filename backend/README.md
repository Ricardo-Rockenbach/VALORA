# Backend do VALORA

API REST em Node.js + Express, persistência PostgreSQL no Neon e acesso ao banco por Prisma ORM.

## Pré-requisitos

- Node.js 20.19 ou superior (recomendado: Node.js 22 LTS).
- npm instalado.

## 1. Criar o banco no Neon

1. Acesse https://console.neon.tech/ e crie um projeto PostgreSQL.
2. Abra **Connect** e copie duas URLs do mesmo banco:
   - **Pooled connection** (o hostname contém `-pooler`): vai em `DATABASE_URL`.
   - **Direct connection** (sem `-pooler`): vai em `DIRECT_URL`.
3. Copie `backend/.env.example` para `backend/.env` e substitua usuário, senha, endpoint e região pelas URLs fornecidas pelo Neon.
4. Não envie essas URLs para o GitHub nem compartilhe as senhas em mensagens.

O runtime utiliza a URL pooled via `@prisma/adapter-neon`; o Prisma CLI utiliza `DIRECT_URL` para migrações. Como estamos fixando Prisma ORM 6.19.3, as duas URLs são declaradas no `schema.prisma`.

## 2. Instalar e criar as tabelas

No terminal, na pasta `backend`:

```bash
npm install
npm run db:generate
npm run db:migrate
```

A migração cria as seis tabelas: `equipamentos`, `setores`, `localizacoes`, `fornecedores`, `manutencoes` e `tarefas`.

## 3. Importar os dados da API fake

```bash
npm run db:seed
```

O seed usa `prisma/seed-data.json`, baseado no ZIP separado `VALORA-API-FAKE.zip`. Ele converte os IDs antigos para inteiros, preserva os relacionamentos e importa os registros iniciais.

**Atenção:** o seed apaga os registros existentes nessas seis tabelas antes de importar os dados. Rode-o somente no banco novo/vazio ou depois de fazer backup.

## 4. Iniciar a API

Ainda na pasta `backend`:

```bash
npm run dev
```

A API fica em `http://localhost:3000`. O teste de conexão com o banco fica em `http://localhost:3000/api/health`.

## 5. Iniciar o frontend

Em outro terminal, na raiz do projeto VALORA:

```bash
npm install
npm run dev
```

O frontend continua usando `VITE_API_URL` (padrão `http://localhost:3000`), então os arquivos existentes em `src/servicos` continuam consumindo os mesmos endpoints.

## Endpoints

| Método | Endpoint | Ação |
|---|---|---|
| GET | `/equipamentos` | Listar equipamentos |
| GET | `/equipamentos/:id` | Buscar equipamento |
| POST | `/equipamentos` | Cadastrar equipamento |
| PATCH / PUT | `/equipamentos/:id` | Atualizar equipamento |
| DELETE | `/equipamentos/:id` | Excluir equipamento |

O mesmo CRUD está disponível para `/setores`, `/localizacoes`, `/fornecedores`, `/manutencoes` e `/tarefas`. O filtro `GET /tarefas?manutencaoId=1` continua disponível.

## Comandos úteis

```bash
npm run db:studio   # Interface visual do banco
npm run db:deploy   # Aplicar migrações já criadas em produção
```

## Observação sobre autenticação

A tela de login do frontend ainda é demonstrativa e aceita qualquer usuário/senha preenchidos. O JSON original não possui uma coleção de usuários, então esta migração não cria autenticação fictícia nem armazena senhas sem um fluxo de segurança definido. Antes de publicar o sistema para uso real, será necessário implementar autenticação (hash de senha, sessão/token e proteção das rotas).
