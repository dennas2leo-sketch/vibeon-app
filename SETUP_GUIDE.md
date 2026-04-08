# VibeOn App - Guia de Configuração e Build

## Correções Implementadas

### 1. **Erro "Please login (10001)" - CORRIGIDO**
**Problema:** O token de autenticação não estava sendo enviado nas requisições após o login, causando falha na criação do perfil e posts.

**Solução:** Modificado o arquivo `lib/auth-context.tsx` para enviar automaticamente o header `Authorization: Bearer {token}` em todas as requisições tRPC após o login.

### 2. **Imagens Pesadas Travando o App - OTIMIZADO**
**Problema:** Imagens muito grandes em Base64 causavam erros ao salvar no banco de dados e travavam o app.

**Solução:** 
- Reduzida a qualidade das imagens de perfil de 0.7 para 0.4 (galeria) e 0.3 (câmera)
- Reduzida a qualidade das imagens de posts de 0.7 para 0.5 (galeria) e 0.2 (câmera)
- Reduzido o limite máximo de tamanho de imagens de posts de 2MB para 1MB
- Reduzido o limite máximo de tamanho de fotos de perfil de 5MB para 800KB

## Configuração para Build do APK

### Pré-requisitos
- Conta no GitHub
- Personal Access Token (PAT) do GitHub com permissões `repo` e `workflow`
- Credenciais do Gmail (e-mail e chave de app)

### Passo 1: Criar Secrets no GitHub

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret** e adicione cada uma das seguintes variáveis:

```
DATABASE_URL = sua_url_de_banco_de_dados
GMAIL_USER = vibeonsupport@gmail.com
GMAIL_APP_PASSWORD = tewj chvw xhfb anat
EXPO_PUBLIC_OAUTH_PORTAL_URL = https://oauth.manus.im
EXPO_PUBLIC_OAUTH_SERVER_URL = https://api.manus.im
EXPO_PUBLIC_APP_ID = seu_app_id
EXPO_PUBLIC_OWNER_OPEN_ID = seu_owner_open_id
EXPO_PUBLIC_OWNER_NAME = seu_owner_name
EXPO_PUBLIC_API_BASE_URL = https://seu-dominio.com
```

### Passo 2: Disparar o Build

1. Vá para a aba **Actions** do seu repositório
2. Selecione o workflow **Build APK**
3. Clique em **Run workflow**
4. Aguarde a compilação (geralmente leva 10-15 minutos)

### Passo 3: Baixar o APK

1. Assim que o build terminar, clique no workflow executado
2. Role até a seção **Artifacts**
3. Clique em **vibeon-app-apk** para baixar o arquivo `.apk`
4. Transfira o APK para seu celular Android e instale

## Arquivos Modificados

- `lib/auth-context.tsx` - Correção do envio de token de autenticação
- `app/(tabs)/create.tsx` - Otimização de imagens de posts
- `app/profile-setup.tsx` - Otimização de fotos de perfil
- `.github/workflows/build-apk.yml` - Novo workflow para build automático
- `.env.example` - Exemplo de variáveis de ambiente

## Próximos Passos

1. Faça push do código para o GitHub
2. Configure os Secrets no repositório
3. Dispare o workflow de build
4. Baixe e teste o APK no seu celular

## Suporte

Se encontrar algum erro durante o build, verifique:
- Se todos os Secrets estão configurados corretamente
- Se o token do GitHub tem as permissões necessárias
- Os logs do workflow na aba **Actions** do GitHub

