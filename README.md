# PeritoLex

[![CI](https://github.com/M4rc3low/peritolex-app/actions/workflows/ci.yml/badge.svg)](https://github.com/M4rc3low/peritolex-app/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Aplicação web para organizar **processos, prazos, documentos, movimentações e alertas** em uma interface responsiva e orientada por dados.

O projeto foi estruturado como base para um painel operacional voltado a produtividade, controle de informações e apoio a rotinas jurídicas, periciais e administrativas.

## Visão de produto

Rotinas de acompanhamento de processos exigem organização constante, controle de prazos, leitura de movimentações, registro de documentos e classificação de prioridades. Quando essas informações ficam espalhadas, aumenta o risco de perda de contexto e retrabalho.

O PeritoLex centraliza esses dados em uma aplicação preparada para evoluir com automações, integrações externas, análises mais avançadas e monitoramento operacional.

## Principais capacidades

- Painel para acompanhamento de processos
- Organização de movimentações processuais
- Controle de prazos e alertas
- Classificação de prioridade e risco
- Registro de documentos relacionados
- Apoio à análise de informações importantes
- Base para automações e integrações futuras
- Interface responsiva para desktop e mobile

## Stack técnica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 |
| Build | Vite 6 |
| Estilização | Tailwind CSS |
| Roteamento | React Router |
| Estado/dados | Client local + localStorage |
| Data fetching | TanStack Query |
| Gráficos | Recharts |
| UI/Icons | Radix UI + Lucide React |
| Qualidade | ESLint + TypeScript check via JSConfig |
| Container | Docker |
| CI | GitHub Actions |

## Arquitetura

```text
src/
├── api/                 # Client local da aplicação
├── components/          # Componentes reutilizáveis por domínio
├── hooks/               # Hooks de apoio
├── lib/                 # Contextos, utilitários e helpers
├── pages/               # Páginas principais
└── main.jsx             # Entrada da aplicação
```

A camada de dados local fica isolada em `src/api/peritolexClient.js`, o que facilita uma evolução futura para backend real, autenticação, banco persistente e integrações externas sem acoplar as páginas diretamente à fonte de dados.

> A implementação atual possui integrações locais simuladas para recursos ainda não conectados a serviços reais. Isso é intencional na versão demonstrativa e evita apresentar funcionalidades externas como se já estivessem em produção.

## Como executar localmente

```bash
git clone https://github.com/M4rc3low/peritolex-app.git
cd peritolex-app
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t peritolex-app .
docker run --rm -p 8080:80 peritolex-app
```

## Scripts e validações

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente local |
| `npm test` | Executa smoke test estrutural |
| `npm run lint` | Executa análise de lint |
| `npm run typecheck` | Executa verificação de tipos/configuração |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza o build local |

A pipeline de CI executa automaticamente **teste, lint, typecheck, build da aplicação e build da imagem Docker** em pushes e pull requests para `main`.

## Qualidade e segurança

- Dados reais de processos não devem ser versionados.
- Documentos, credenciais e informações sensíveis devem ficar fora do repositório.
- Dados demonstrativos devem ser anonimizados.
- Antes de integrar alterações, execute `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.
- Em produção, a camada local deve ser substituída por backend com autenticação, autorização e controle de acesso.

## Roadmap técnico

- [ ] Adicionar screenshots reais da interface
- [ ] Publicar versão demonstrativa
- [ ] Implementar autenticação e perfis de usuário
- [ ] Criar persistência em backend
- [ ] Evoluir módulos de alertas, prazos e prioridade
- [ ] Integrar fontes externas de dados processuais
- [ ] Adicionar logs, observabilidade e monitoramento

## Valor profissional

Este projeto demonstra desenvolvimento web aplicado a um problema operacional real, organização de dados, dashboards e práticas de engenharia como **testes estruturais, CI e containerização**.

## Autor

Desenvolvido por Marcelo Gomes.
