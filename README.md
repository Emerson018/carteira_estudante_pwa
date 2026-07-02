# CIE - Carteirinha de Identificação Estudantil (PWA)

Progressive Web App que replica uma Carteira de Identificação Estudantil (CIE) digital. Projeto escolar que permite ao usuário visualizar, editar e salvar informações em um cartão digital interativo.

## Funcionalidades

- Carteirinha digital com layout fiel ao app de referência
- Animação de flip (frente/verso) ao tocar no cartão
- Edição manual de todos os campos (nome, curso, CPF, data de nascimento, validade, foto)
- QR Code gerado dinamicamente com os dados do estudante
- Persistência de dados em localStorage
- Funciona offline (Service Worker + Cache API)
- Instalável como app nativo (PWA)
- Design responsivo (320px - 428px)
- Acessibilidade (aria-labels, navegação por teclado, skip link)

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Estrutura | HTML5 semântico |
| Estilo | CSS3 (variáveis, Flexbox, 3D Transforms) |
| Lógica | JavaScript ES6+ (vanilla) |
| QR Code | qrcode.js (via CDN) |
| Persistência | localStorage |
| Offline | Service Worker + Cache API |
| Testes | Vitest + fast-check |

## Como Executar

### Visualizar o app

```bash
npx serve .
```

Acesse `http://localhost:3000` no navegador.

### Rodar testes

```bash
npm install
npm test
```

### Gerar assets placeholder

```bash
node generate-assets.js
```

## Estrutura do Projeto

```
carteirinha_estudante_pwa/
├── index.html              # Página principal
├── manifest.json           # Configuração PWA
├── service-worker.js       # Cache offline
├── css/styles.css          # Estilos (mobile-first)
├── js/
│   ├── app.js              # Orquestrador principal
│   ├── storageManager.js   # Persistência localStorage
│   ├── cardManager.js      # Exibição + flip + formatação
│   ├── formManager.js      # Validação + binding de campos
│   ├── qrManager.js        # Geração dinâmica de QR
│   └── navigationManager.js# Navegação entre abas
├── assets/
│   ├── icons/              # Ícones PWA (192x192, 512x512)
│   └── images/             # Logos, selo, fundo do cartão
└── tests/                  # Testes unitários e de propriedade
```

## Arquitetura

O app segue arquitetura modular com 5 managers:

- **StorageManager** — Persistência de dados no localStorage
- **CardManager** — Exibição visual do cartão, animação de flip, formatação de campos
- **FormManager** — Validação de entrada, binding de formulário
- **QRManager** — Geração de QR Code com dados do estudante
- **NavigationManager** — Navegação entre abas (SPA)

## Licença

Projeto escolar — uso educacional.
