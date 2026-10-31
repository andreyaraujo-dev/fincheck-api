# Guia de uso

## Pré-requisitos

- Node.js 20+
- Banco configurado em `DATABASE_URL`
- Serviços externos opcionais: Stripe e Brevo

## Preparar o ambiente

```bash
npm install
cp .env.example .env
npx prisma generate
```

Preencha `DATABASE_URL`, `JWT_SECRET` e `NODE_ENV`. Configure as variáveis `STRIPE_*` para assinaturas e `BREVO_*` para e-mails.

## Executar

```bash
npm run start:dev
```

O frontend MyCash deve usar a mesma URL através de `VITE_API_URL`.

## Fluxo inicial da API

1. Crie uma conta com `POST /auth/signup`.
2. Autentique-se com `POST /auth/signin`.
3. Envie o token recebido como `Authorization: Bearer <token>`.
4. Cadastre contas em `/bank-accounts` e categorias em `/categories`.
5. Registre e consulte lançamentos em `/transactions`.
6. Use `/goals`, `/reports`, `/people` e `/notifications` conforme a necessidade.

O módulo `auth` também oferece recuperação/alteração de senha e MFA. Assinaturas usam `/plans`, `/subscriptions` e o webhook `POST /webhooks/stripe`.

## Validação

```bash
npm test
npm run test:e2e
npm run build
```

Consulte os controllers em `src/modules` para os payloads e regras de cada endpoint.
