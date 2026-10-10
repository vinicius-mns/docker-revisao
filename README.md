# API

API Express 5 com MongoDB/Mongoose. Cards e tags exigem uma sessão de usuário e cada consulta é limitada ao proprietário do registro.

## Configuração

1. Copie `.env.example` para `.env`.
2. Configure `MONGODB_URI` com a conexão do MongoDB.
3. Configure o SMTP para habilitar verificação e recuperação por e-mail:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
   - `SMTP_USER` e `SMTP_PASSWORD` quando o servidor exigir autenticação
   - `SMTP_FROM` com um endereço autorizado pelo provedor
4. Ajuste `APP_URL` para o endereço público da API e `WEB_APP_URL` para o endereço do frontend.
5. Execute `npm install`, `npm run build` e `npm run dev`.

Sem SMTP configurado, os endpoints que precisam enviar e-mail respondem com erro `503`. Em produção, use um provedor SMTP e uma senha de aplicação/credencial própria; não versiona o arquivo `.env`.

## Conta e sessão

| Método | Endpoint | Uso |
|---|---|---|
| `POST` | `/users/register` | Cria conta `{ "email", "password" }`; senha com pelo menos 12 caracteres e e-mail ainda não verificado |
| `GET` | `/users/verify-email?token=...` | Verifica o endereço usando o link enviado |
| `POST` | `/users/resend-verification` | Reenvia a verificação para uma conta pendente |
| `POST` | `/users/login` | Autentica `{ "email", "password" }` e retorna token Bearer |
| `GET` | `/users/me` | Confirma a sessão atual |
| `POST` | `/users/logout` | Revoga a sessão atual |
| `POST` | `/users/forgot-password` | Solicita redefinição `{ "email" }`; e-mail é enviado somente se a conta existir |
| `POST` | `/users/reset-password` | Define `{ "token", "password" }` a partir do link do e-mail |

O token de sessão deve ser enviado nas rotas de cards e tags como:

```http
Authorization: Bearer <token>
```

Tokens de verificação expiram em 24 horas, de redefinição em 1 hora e sessões em 7 dias. Redefinir a senha revoga todas as sessões existentes. Senhas são derivadas com `scrypt` e sal aleatório; não se usa bcrypt nem se armazena senha em texto.

O frontend deve criar uma página `/reset-password` que leia o parâmetro `token` da URL e envie token e nova senha para `POST /users/reset-password`.

## Cards e tags de usuários antigos

Os registros preexistentes não têm dono. Eles não ficam visíveis pelas rotas autenticadas até serem atribuídos. Após configurar o banco e criar/verificar a conta que será proprietária, execute uma única vez:

```sh
npm run migrate:legacy -- usuario@exemplo.com
```

O comando atribui todos os cards e tags sem `ownerId` à conta verificada informada; confirme que essa conta deve ser proprietária antes de executar. Novos registros recebem automaticamente o ID do usuário da sessão. Cards só podem referenciar tags pertencentes ao mesmo usuário.

## Desenvolvimento e testes

```sh
npm run dev
npm run build
npm test -- --run
```

Os testes de rotas usam MongoDB em memória; na primeira execução pode ser necessário baixar o binário do MongoDB.
