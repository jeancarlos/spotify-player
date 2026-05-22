# Spoter

Spoter é um player de música web imersivo integrado com a API do Spotify, utilizando React, TypeScript, Vite, Tailwind CSS e Shadcn/UI com Glassmorphism.

## Configuração do Spotify (Obtendo o Client ID)

Para que a autenticação e as chamadas à API funcionem, você precisa de um **Client ID** do Spotify e configurar o Redirect URI. Siga os passos abaixo:

1. **Acesse o Dashboard de Desenvolvedor do Spotify:**
   Vá para [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) e faça login com a sua conta do Spotify.

2. **Crie uma aplicação (Create app):**
   - Preencha o nome (ex: `Spoter Local`) e a descrição.
   - Em **Redirect URIs**, insira exatamente: `https://localhost:5175/callback`
   - Marque as opções necessárias e aceite os termos para criar o app.

3. **Copie o Client ID:**
   Na página da sua nova aplicação, clique em **Settings** (Configurações) e copie a string alfanumérica em **Client ID**.

4. **Configure o `.env`:**
   No diretório raiz do projeto, crie ou edite o arquivo `.env` (use o `.env.example` como base) e adicione seu Client ID:

   ```bash
   VITE_SPOTIFY_CLIENT_ID=cole_seu_client_id_aqui
   VITE_SPOTIFY_REDIRECT_URI=https://localhost:5175/callback
   ```

## Executando o Projeto

1. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

> **Aviso de HTTPS Local:** O projeto usa o `@vitejs/plugin-basic-ssl` para gerar um certificado autoassinado (obrigatório para algumas APIs web e integrações OAuth avançadas). O navegador exibirá um aviso de "Sua conexão não é privada". Clique em **Avançado** e **Ir para localhost (não seguro)**.

## Scripts Úteis

- `npm run dev`: Inicia o servidor local.
- `npm run build`: Gera a build de produção.
- `npm run lint`: Executa a verificação de código.
- `npm test`: Roda a suíte de testes com o Vitest.
