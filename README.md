# ⚖️ PeritoLex

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![LegalTech](https://img.shields.io/badge/domain-LegalTech-2563EB)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F59E0B)

Aplicação web voltada à organização de **processos, prazos, documentos, movimentações e prioridades**, criada para transformar informações dispersas em um painel operacional mais claro e acionável.

O projeto foi desenvolvido com foco em **experiência do usuário, organização de dados e evolução arquitetural**, servindo também como laboratório prático de desenvolvimento front-end aplicado a um problema real.

## 🎯 Problema que o projeto resolve

Rotinas jurídicas, periciais e administrativas exigem acompanhamento constante de processos, prazos, documentos e movimentações. Quando essas informações ficam distribuídas entre planilhas, anotações e diferentes sistemas, aumentam os riscos de perda de contexto, retrabalho e atrasos.

O **PeritoLex** centraliza essas informações em uma interface única, visual e orientada por prioridade.

## ✨ Principais funcionalidades

- Dashboard para acompanhamento operacional
- Organização de processos e movimentações
- Controle de prazos e alertas
- Classificação por prioridade e risco
- Registro de documentos relacionados
- Indicadores e visualizações para apoio à decisão
- Interface responsiva para desktop e mobile
- Estrutura preparada para futuras integrações e automações

## 🧰 Stack técnica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 |
| Build | Vite |
| Estilização | Tailwind CSS |
| Roteamento | React Router |
| Estado e dados | Client local + localStorage |
| Data fetching | TanStack Query |
| Gráficos | Recharts |
| UI e ícones | Radix UI + Lucide React |

## 🏗️ Arquitetura

```text
src/
├── api/                 # Camada de acesso a dados
├── components/          # Componentes reutilizáveis
├── hooks/               # Hooks de apoio
├── lib/                 # Contextos, helpers e utilitários
├── pages/               # Páginas principais
└── main.jsx             # Entrada da aplicação
```

A camada de dados foi isolada para permitir que o projeto evolua de armazenamento local para uma arquitetura com **backend, autenticação, banco de dados persistente e integrações externas** sem exigir uma reestruturação completa do front-end.

## 🚀 Executando localmente

```bash
git clone https://github.com/M4rc3low/peritolex-app.git
cd peritolex-app
npm install
npm run dev
```

Para gerar e visualizar o build de produção:

```bash
npm run build
npm run preview
```

## 📜 Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Executa uma prévia do build |
| `npm run lint` | Executa análise de lint |
| `npm run lint:fix` | Corrige problemas de lint automaticamente |
| `npm run typecheck` | Executa verificações de tipos/configuração |

## 🔐 Qualidade e segurança

- Dados reais de processos não devem ser versionados.
- Credenciais, documentos e informações sensíveis devem permanecer fora do repositório.
- Dados utilizados para demonstração devem ser anonimizados.
- Antes de publicar novas versões, o projeto deve passar por build, lint e verificações disponíveis.
- Uma futura versão de produção deverá utilizar backend com autenticação, autorização e controle de acesso.

## 🗺️ Roadmap

- [ ] Adicionar screenshots reais da interface
- [ ] Publicar uma versão demonstrativa
- [ ] Implementar autenticação e perfis de usuário
- [ ] Criar backend e persistência em banco de dados
- [ ] Evoluir os módulos de alertas, prazos e prioridades
- [ ] Integrar fontes externas de dados processuais
- [ ] Adicionar logs, observabilidade e monitoramento
- [ ] Preparar pipeline de CI/CD e deploy

## 💼 O que este projeto demonstra

Este projeto faz parte do meu portfólio e demonstra experiência prática com:

- Desenvolvimento de interfaces em React
- Componentização e organização de aplicações front-end
- Modelagem de fluxos orientados a dados
- Construção de dashboards operacionais
- Separação entre interface e camada de dados
- Planejamento de evolução para arquitetura full stack
- Aplicação de tecnologia a um problema real de negócio

## 👨‍💻 Autor

Desenvolvido por **Marcelo Gomes**.
