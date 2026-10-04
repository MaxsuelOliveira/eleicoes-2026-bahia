# Eleições 2026 · Bahia

Painel web em React para acompanhar, em tempo real, a apuração das Eleições Gerais de 2026 em todo o Brasil.

O projeto consulta as fontes públicas de apuração, mostra os indicadores da totalização e ajuda a acompanhar candidatos específicos por meio de busca, favoritos e alertas locais.

## Acesse

Após a primeira publicação no GitHub Pages, o endereço será:

`https://maxsueloliveira.github.io/eleicoes-2026-bahia/`

## Recursos

- Seletor para os 26 estados e o Distrito Federal.
- Apuração de **Presidente**, **Governador**, **Senador**, **Deputado Federal** e **Deputado Estadual**.
- Atualização automática a cada 30 segundos e botão de atualização manual.
- Percentual de apuração, seções totalizadas, votos válidos e comparecimento.
- Busca por nome, partido ou número de candidato.
- Candidatos fixados em um painel único, mesmo que sejam de cargos diferentes.
- Alertas na página quando os votos de um candidato fixado mudarem.
- Notificações nativas do navegador, quando a pessoa optar por ativá-las.
- Layout adaptado para celular e desktop.

## Fontes de dados

Os dados são obtidos diretamente dos arquivos JSON públicos de divulgação do Tribunal Superior Eleitoral (TSE), em `https://resultados.tse.jus.br`.

O aplicativo monta as URLs oficiais conforme a documentação técnica do TSE:

- Presidente (abrangência Brasil): `.../ele2026/6257/dados/br/br-c0001-e006257-u.json`
- Cargos estaduais por UF: `.../ele2026/6259/dados/{uf}/{uf}-c{cargo}-e006259-u.json`

Os códigos de cargo utilizados são `0003` (Governador), `0005` (Senador), `0006` (Deputado Federal) e `0007` (Deputado Estadual).

O aplicativo não altera os dados das fontes e não estima resultados. Quando a fonte informar `0,00%` de apuração, esse é exatamente o estado apresentado na interface.

## Como executar localmente

### Pré-requisitos

- Node.js 22 ou superior
- npm 10 ou superior

### Instalação

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite, normalmente `http://localhost:5173`.

### Gerar versão de produção

```bash
npm run build
npm run preview
```

O build é criado na pasta `dist/`.

## Favoritos e alertas

1. Pesquise um candidato pelo nome, partido ou número.
2. Clique na estrela ao lado do nome para fixá-lo.
3. O candidato aparecerá em **Candidatos fixados**.
4. Clique em **Ativar alertas** e aceite a permissão do navegador se desejar notificações nativas.

Os favoritos são armazenados somente no `localStorage` do navegador atual. Nenhum dado pessoal ou lista de favoritos é enviado a um servidor. Os alertas são comparações feitas a cada atualização dos dados, portanto funcionam enquanto a página estiver aberta. Notificações com o navegador fechado exigiriam um backend e uma estrutura de Web Push, que não fazem parte deste projeto estático.

## Publicação no GitHub Pages

O site está publicado no GitHub Pages pela branch `gh-pages`, com HTTPS ativo. A branch contém apenas o build estático da pasta `dist/`; o código-fonte permanece na `main`.

### Atualizar a publicação atual

```bash
npm ci
npm run build:pages
```

Publique o conteúdo de `dist/` na branch `gh-pages`. O build deve sempre usar `build:pages`, pois ele configura o caminho-base correto para o endereço do projeto no GitHub Pages.

### Automação futura com GitHub Actions

O workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) está pronto para publicar automaticamente cada push na branch `main`. Para utilizá-lo, em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.

O workflow então:

1. instala as dependências com `npm ci`;
2. gera o build com o caminho-base correto do repositório;
3. envia a pasta `dist/` como artefato;
4. publica o artefato no ambiente `github-pages`.

Para acompanhar, abra a aba **Actions** do repositório e veja o workflow **Publicar no GitHub Pages**. A URL final é exibida no job de deploy.

> A conta GitHub usada nesta publicação está com os runners hospedados bloqueados por uma pendência de cobrança, portanto o workflow não consegue iniciar neste momento. A publicação estática atual continua funcionando normalmente; após regularizar a conta, basta selecionar **GitHub Actions** para restabelecer o deploy automático.

## Estrutura

```text
src/main.jsx                 interface, consumo da API e regras de favoritos/alertas
src/styles.css               estilos responsivos
.github/workflows/           automação do GitHub Pages
```

## Limitações conhecidas

- A disponibilidade e o formato dos dados dependem das fontes externas.
- GitHub Pages hospeda somente a interface estática; não existe banco de dados nem autenticação.
- A permissão para notificações pertence ao navegador e pode ser revogada nas configurações dele.

## Desenvolvimento

```bash
npm run build
git diff --check
```

Essas são as validações mínimas antes de enviar alterações para a branch `main`.
