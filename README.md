# Fincheck API

API do MyCash para autenticação, contas, categorias, transações, metas, relatórios, notificações, pessoas e assinaturas.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma)

## Visão geral

O backend fornece a base de dados e as regras de negócio do MyCash. Há suporte a autenticação, MFA, recuperação de senha, lançamentos recorrentes, exportação e simulação de transações, metas, compartilhamento com pessoas, notificações e integração de assinaturas com Stripe.

## Stack

- Node.js e TypeScript
- NestJS
- Prisma e banco relacional configurado por `DATABASE_URL`
- JWT, MFA e validação de entrada
- Stripe e Brevo para recursos de assinatura e comunicação
- Jest para testes

## Configuração local

Pré-requisitos: Node.js 20+ e um banco compatível com o schema Prisma.

```bash
npm install
cp .env.example .env
npx prisma generate
```

Preencha o `.env` conforme o recurso usado. `DATABASE_URL` e `JWT_SECRET` são essenciais; Stripe e Brevo são necessários para os fluxos correspondentes.

## Executando

```bash
npm run start:dev
```

Comandos úteis:

```bash
npm run build
npm run start:prod
npm test
npm run test:e2e
```

## Módulos da API

- `auth`: cadastro, login, MFA, senha e conta.
- `users`: perfil do usuário.
- `bank-accounts`, `categories` e `transactions`: organização financeira.
- `goals` e `reports`: metas e indicadores.
- `people`: compartilhamento de dados.
- `notifications`: notificações e leitura.
- `plans`, `subscriptions` e `webhooks`: planos e Stripe.

As rotas detalhadas e exemplos de autenticação estão em [`docs/USAGE.md`](docs/USAGE.md). O frontend consumidor é o projeto [`my-cash`](../my-cash).

## Screenshots

Adicione prints do Swagger, API ou telas integradas em [`assets/screenshots/`](assets/screenshots/):

```md
<!-- ![Fluxo da API](assets/screenshots/api-flow.png) -->
```

## Estrutura

Os módulos de negócio ficam em [`src/modules`](src/modules) e o modelo de dados em [`prisma/schema.prisma`](prisma/schema.prisma).
