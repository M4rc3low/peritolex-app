# PeritoLex

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![LegalTech](https://img.shields.io/badge/domain-legaltech-blue)
![Status](https://img.shields.io/badge/status-active-brightgreen)

PeritoLex e uma aplicacao web para organizar processos, prazos, documentos, movimentacoes e alertas importantes em uma interface clara, responsiva e orientada por dados.

O projeto foi estruturado como uma base para um painel operacional inteligente, com foco em produtividade, controle de informacoes e apoio a rotinas juridicas, periciais e administrativas.

## Visao de produto

Rotinas de acompanhamento de processos exigem organizacao constante, controle de prazos, leitura de movimentacoes, registro de documentos e classificacao de prioridades. Quando essas informacoes ficam espalhadas, aumenta o risco de atraso, perda de contexto e retrabalho.

O PeritoLex busca reduzir esse problema com uma aplicacao centralizada, visual e preparada para evoluir com automacoes, integracoes externas, analises mais avancadas e monitoramento operacional.

## Principais capacidades

- Painel para acompanhamento de processos
- Organizacao de movimentacoes processuais
- Controle de prazos e alertas
- Classificacao de prioridade e risco
- Registro de documentos relacionados
- Apoio a analise de informacoes importantes
- Base para automacoes e integracoes futuras
- Interface responsiva para desktop e mobile

## Stack tecnica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 |
| Build | Vite |
| Estilizacao | Tailwind CSS |
| Roteamento | React Router |
| Estado/dados | Local client + localStorage |
| Data fetching | TanStack Query |
| Graficos | Recharts |
| UI/Icons | Radix UI + Lucide React |

## Arquitetura

```txt
src/
├── api/                 # Client local da aplicacao
├── components/          # Componentes reutilizaveis por dominio
├── hooks/               # Hooks de apoio
├── lib/                 # Contextos, utilitarios e helpers
├── pages/               # Paginas principais
└── main.jsx             # Entrada da aplicacao
```

A camada de dados foi separada em um client local para facilitar evolucao futura para backend real, autenticacao, banco persistente, integracoes externas e rotinas automatizadas.

## Como executar localmente

```bash
git clone https://github.com/M4rc3low/peritolex-app.git
cd peritolex-app
npm install
npm run dev
```

Build de producao:

```bash
npm run build
npm run preview
```

## Scripts

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia o ambiente local |
| `npm run build` | Gera build de producao |
| `npm run preview` | Visualiza o build local |
| `npm run lint` | Executa analise de lint |
| `npm run lint:fix` | Corrige problemas automaticos de lint |
| `npm run typecheck` | Executa verificacao de tipos/configuracao |

## Qualidade e seguranca

- Dados reais de processos nao devem ser versionados.
- Arquivos sensiveis, documentos e credenciais devem ficar fora do repositorio.
- Dados demonstrativos devem ser anonimizados.
- Antes de publicar, executar `npm run build`, `npm run lint` e `npm run typecheck`.
- Em producao, a camada local deve ser substituida por backend com autenticacao, autorizacao e controle de acesso.

## Roadmap tecnico

- [ ] Adicionar screenshots reais da interface
- [ ] Publicar versao demonstrativa
- [ ] Implementar autenticacao e perfis de usuario
- [ ] Criar persistencia em backend
- [ ] Evoluir modulos de alertas, prazos e prioridade
- [ ] Integrar fontes externas de dados processuais
- [ ] Adicionar logs, observabilidade e monitoramento
- [ ] Preparar deploy em ambiente de producao

## Valor profissional

Este projeto demonstra desenvolvimento web aplicado a um problema real de operacao: organizacao de dados, automacao, acompanhamento de prazos, dashboards e construcao de interfaces orientadas a decisao.

## Autor

Desenvolvido por Marcelo Gomes.
