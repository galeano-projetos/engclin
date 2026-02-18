# Manual do Sistema Vitalis (Engclin)

**Sistema de Gestao de Equipamentos Medico-Hospitalares**
Versao: 1.0 | Atualizado em: Fevereiro 2026

---

## Sumario

1. [Visao Geral](#1-visao-geral)
2. [Acesso ao Sistema](#2-acesso-ao-sistema)
3. [Perfis de Usuario e Permissoes](#3-perfis-de-usuario-e-permissoes)
4. [Planos e Funcionalidades](#4-planos-e-funcionalidades)
5. [Dashboard](#5-dashboard)
6. [Equipamentos](#6-equipamentos)
7. [Manutencoes Preventivas](#7-manutencoes-preventivas)
8. [Chamados Corretivos](#8-chamados-corretivos)
9. [Fisica Medica (RDC 611)](#9-fisica-medica-rdc-611)
10. [Relatorios](#10-relatorios)
11. [Inteligencia Artificial](#11-inteligencia-artificial)
12. [Administracao](#12-administracao)
    - [Usuarios](#121-usuarios)
    - [Fornecedores](#122-fornecedores)
    - [Tipos de Equipamento](#123-tipos-de-equipamento)
    - [Contratos](#124-contratos)
    - [Importacao de Dados](#125-importacao-de-dados)
13. [Plataforma (Multi-tenant)](#13-plataforma-multi-tenant)
14. [Integracoes](#14-integracoes)
    - [Seprorad (Fisica Medica)](#141-seprorad-fisica-medica)
    - [Alertas por Email/SMS](#142-alertas-por-emailsms)
15. [Pagina Publica de Equipamento](#15-pagina-publica-de-equipamento)
16. [Perguntas Frequentes](#16-perguntas-frequentes)

---

## 1. Visao Geral

O **Vitalis (Engclin)** e um sistema SaaS multi-tenant para gestao completa de parques tecnologicos medico-hospitalares. Ele atende a normas regulatorias brasileiras (RDC 611, IN 90-96) e oferece:

- Cadastro e rastreamento de equipamentos medicos
- Agendamento e controle de manutencoes preventivas, calibracoes e testes de seguranca eletrica (TSE)
- Abertura e acompanhamento de chamados corretivos
- Gestao de testes de fisica medica com integracao Seprorad
- Relatorios gerenciais e indicadores visuais (graficos)
- Modulo de inteligencia artificial para analise estrategica
- Controle de fornecedores e contratos
- Alertas automaticos de vencimento por email/SMS
- Importacao massiva de dados via planilha Excel

O sistema e acessado via navegador web (desktop e mobile) e nao requer instalacao.

---

## 2. Acesso ao Sistema

### Login

1. Acesse a URL do sistema (fornecida pelo administrador)
2. Informe seu **email** e **senha**
3. Clique em **Entrar**

### Requisitos de Senha

- Minimo 8 caracteres
- Ao menos 1 letra maiuscula
- Ao menos 1 numero
- Ao menos 1 caractere especial (ex: `@`, `#`, `!`)

### Sessao

- A sessao dura **8 horas** apos o login
- Apos esse periodo, voce sera redirecionado para a tela de login
- Usuarios inativos ou com tenant inativo nao conseguem fazer login

---

## 3. Perfis de Usuario e Permissoes

O sistema possui **5 perfis de usuario**, cada um com um conjunto especifico de permissoes:

### MASTER (Administrador da Instituicao)

Acesso completo a todas as funcionalidades do tenant. E o unico perfil que pode:

| Modulo | Permissoes |
|--------|-----------|
| Equipamentos | Visualizar, Criar, Editar, **Excluir** |
| Manutencoes Preventivas | Visualizar, Criar, Executar, **Excluir** |
| Chamados Corretivos | Visualizar, Criar, Aceitar, Resolver, Fechar |
| Fisica Medica | Visualizar, Criar, Executar, **Excluir** |
| Relatorios | Visualizar |
| Inteligencia Artificial | Visualizar |
| Administracao | Usuarios, Unidades, Fornecedores, Tipos, Contratos, Importacao |

### TECNICO (Tecnico de Engenharia Clinica)

Perfil operacional. Pode executar servicos e gerenciar dados tecnicos:

| Modulo | Permissoes |
|--------|-----------|
| Equipamentos | Visualizar, Criar, Editar |
| Manutencoes Preventivas | Visualizar, Criar, Executar |
| Chamados Corretivos | Visualizar, Aceitar, Resolver |
| Fisica Medica | Visualizar, Criar, Executar |
| Relatorios | Visualizar |
| Inteligencia Artificial | Visualizar |
| Fornecedores | Visualizar |
| Tipos de Equipamento | Visualizar |
| Contratos | Visualizar |

### COORDENADOR

Perfil de supervisao. Pode abrir e fechar chamados, mas nao executa servicos tecnicos:

| Modulo | Permissoes |
|--------|-----------|
| Equipamentos | Visualizar |
| Manutencoes Preventivas | Visualizar |
| Chamados Corretivos | Visualizar, **Criar**, **Fechar** |
| Dashboard | Visualizar |

### FISCAL

Perfil de auditoria e fiscalizacao. Acesso somente leitura:

| Modulo | Permissoes |
|--------|-----------|
| Equipamentos | Visualizar |
| Manutencoes Preventivas | Visualizar |
| Chamados Corretivos | Visualizar |
| Fisica Medica | Visualizar |
| Relatorios | Visualizar |
| Dashboard | Visualizar |

### PLATFORM_ADMIN (Administrador da Plataforma)

Acesso exclusivo ao painel de gestao multi-tenant. Nao acessa os modulos operacionais dos tenants. Gerencia:

- Criacao e edicao de tenants (instituicoes)
- Ativacao/desativacao de tenants
- Definicao de planos (ESSENCIAL, PROFISSIONAL, ENTERPRISE)
- Dashboard da plataforma com estatisticas globais

---

## 4. Planos e Funcionalidades

O sistema opera com 3 niveis de plano que determinam quais modulos estao disponiveis:

### ESSENCIAL

Funcionalidades basicas de gestao:

- Dashboard com indicadores
- Cadastro de equipamentos (CRUD completo)
- Manutencoes preventivas (tipo PREVENTIVA apenas)
- Administracao de usuarios e unidades

### PROFISSIONAL

Tudo do Essencial, mais:

- **Calibracoes** e **Testes de Seguranca Eletrica (TSE)**
- **Chamados corretivos** (abertura e gestao de tickets)
- **Fisica Medica** (testes RDC 611)
- **Fornecedores** e **Contratos**
- **Tipos de equipamento** com periodicidades padrao
- **Importacao de dados** via Excel
- **Relatorios avancados**: calibracoes vencidas, historico de custos, indicadores de chamados

### ENTERPRISE

Tudo do Profissional, mais:

- **Inteligencia Artificial** (agentes de analise estrategica)
- **QR Code** para identificacao de equipamentos

### Resumo por Funcionalidade

| Funcionalidade | Essencial | Profissional | Enterprise |
|---------------|:---------:|:------------:|:----------:|
| Dashboard e graficos | ✅ | ✅ | ✅ |
| Equipamentos (CRUD) | ✅ | ✅ | ✅ |
| Manutencoes preventivas | ✅ | ✅ | ✅ |
| Calibracoes e TSE | — | ✅ | ✅ |
| Chamados corretivos | — | ✅ | ✅ |
| Fisica medica | — | ✅ | ✅ |
| Fornecedores | — | ✅ | ✅ |
| Contratos | — | ✅ | ✅ |
| Tipos de equipamento | — | ✅ | ✅ |
| Importacao Excel | — | ✅ | ✅ |
| Relatorios avancados | — | ✅ | ✅ |
| Relatorio inventario | ✅ | ✅ | ✅ |
| Inteligencia artificial | — | — | ✅ |
| QR Code | — | — | ✅ |

> **Nota:** Ao acessar uma funcionalidade indisponivel no seu plano, o sistema exibe uma mensagem orientando a realizar upgrade.

---

## 5. Dashboard

**Rota:** `/dashboard`
**Permissao:** `dashboard.view` (MASTER, TECNICO, COORDENADOR, FISCAL)

O Dashboard e a tela inicial apos o login. Oferece uma visao geral rapida do parque tecnologico:

### Cards de Resumo

Quatro cards na parte superior com links diretos:

| Card | Descricao | Link |
|------|-----------|------|
| **Total de Equipamentos** | Quantidade total cadastrada | `/equipamentos` |
| **Servicos Vencidos** | Preventivas agendadas com data vencida | `/manutencoes?status=VENCIDA` |
| **Chamados Abertos** | Chamados com status ABERTO ou EM_ATENDIMENTO | `/chamados?status=ABERTO` |
| **Equipamentos Ativos** | Com status ATIVO | `/equipamentos?status=ATIVO` |

### Painel por Tipo de Servico

Tres cards mostrando, para cada tipo de servico (Preventiva, Calibracao, TSE):

- **Em dia**: agendadas com prazo > 30 dias
- **Vencendo**: agendadas com prazo <= 30 dias
- **Vencido**: agendadas com data no passado
- **Realizada**: total de servicos ja executados

### Proximos Vencimentos

Lista das **10 proximas** preventivas a vencer nos proximos 60 dias, ordenadas por data. Cada item mostra:
- Nome do equipamento
- Tipo de servico (Preventiva/Calibracao/TSE)
- Data de vencimento
- Dias restantes (com badge colorido: vermelho <= 15d, amarelo <= 30d, azul > 30d)

### Chamados Abertos

Lista dos **5 chamados mais recentes** abertos ou em atendimento, mostrando:
- Nome do equipamento
- Descricao resumida
- Quem abriu e quando
- Urgencia (Baixa, Media, Alta, Critica)

### Indicadores Visuais (Graficos)

Cinco graficos interativos:

1. **Equipamentos por Status** — grafico de pizza (Ativo, Inativo, Em Manutencao, Descartado)
2. **Equipamentos por Criticidade** — grafico de pizza (1-Critico, 2-Moderado, 3-Baixo)
3. **Status de Calibracoes** — grafico de pizza (Em dia, Vencendo 30d, Vencida, Realizada)
4. **Manutencoes por Mes** — grafico de barras dos ultimos 6 meses (preventivas vs corretivas)
5. **Chamados por Urgencia** — grafico de barras (Baixa, Media, Alta, Critica)

---

## 6. Equipamentos

### Listagem de Equipamentos

**Rota:** `/equipamentos`
**Permissao:** `equipment.view` (MASTER, TECNICO, COORDENADOR, FISCAL)

Exibe todos os equipamentos cadastrados no tenant com:

- **Filtros**: por status, setor/unidade, criticidade, texto livre (nome ou patrimonio)
- **Paginacao**: 20, 50, 100, 150, 200 itens por pagina ou "Todos"
- **Colunas da tabela**: Nome, Patrimonio, Setor, Criticidade, Status
- **Layout responsivo**: cards no mobile, tabela no desktop

### Cadastro de Equipamento

**Rota:** `/equipamentos/novo`
**Permissao:** `equipment.create` (MASTER, TECNICO)

Formulario com os seguintes campos:

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Nome | Sim | Nome do equipamento |
| Fabricante | Sim | Fabricante do equipamento |
| Modelo | Sim | Modelo do equipamento |
| Numero de Serie | Nao | Identificacao serial |
| Patrimonio | Nao | Numero patrimonial da instituicao |
| Anvisa | Nao | Registro Anvisa do equipamento |
| Unidade/Setor | Sim | Setor onde esta instalado (lista das unidades cadastradas) |
| Tipo de Equipamento | Nao | Tipo pre-configurado (herda criticidade padrao) |
| Criticidade | Sim | A (Critico), B (Moderado) ou C (Baixo) |
| Status | Sim | ATIVO, INATIVO, EM_MANUTENCAO ou DESCARTADO |
| Data de Aquisicao | Nao | Data de compra |
| Valor de Aquisicao | Nao | Valor pago pelo equipamento (R$) |

> **Dica:** Ao selecionar um **Tipo de Equipamento**, a criticidade e preenchida automaticamente com o padrao configurado para aquele tipo.

### Detalhes do Equipamento

**Rota:** `/equipamentos/[id]`
**Permissao:** `equipment.view`

Exibe todas as informacoes do equipamento, incluindo:

- Dados cadastrais completos
- **Status dos servicos**: quadro visual mostrando o status de cada tipo de servico (Preventiva, Calibracao, TSE) — Em dia, Vencendo, Vencido ou Nao agendado
- **Historico de manutencoes preventivas** vinculadas ao equipamento
- **Historico de testes de fisica medica** vinculados
- **Botoes de acao**: Editar (MASTER, TECNICO), Excluir (MASTER)

### Edicao de Equipamento

**Permissao:** `equipment.edit` (MASTER, TECNICO)

Mesmos campos do cadastro. Acessado pelo botao "Editar" na pagina de detalhes.

### Exclusao de Equipamento

**Permissao:** `equipment.delete` (somente MASTER)

Exclui permanentemente o equipamento e todos os registros associados.

---

## 7. Manutencoes Preventivas

### Listagem de Manutencoes

**Rota:** `/manutencoes`
**Permissao:** `preventive.view` (MASTER, TECNICO, COORDENADOR, FISCAL)

Lista todas as manutencoes preventivas com:

- **Filtros**:
  - Status: Agendada, Realizada, Vencida
  - Tipo de servico: Preventiva, Calibracao, TSE (conforme plano)
  - Fornecedor
  - Equipamento
  - Texto livre
- **Paginacao**: 20, 50, 100, 150, 200 ou Todos
- **Colunas**: Equipamento, Tipo, Fornecedor, Data Agendada, Vencimento, Status
- **Layout responsivo**: cards no mobile, tabela no desktop

### Nova Manutencao Preventiva

**Rota:** `/manutencoes/nova`
**Permissao:** `preventive.create` (MASTER, TECNICO)

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Equipamento | Sim | Selecionar da lista de equipamentos ativos |
| Tipo de Servico | Sim | PREVENTIVA, CALIBRACAO ou TSE (conforme plano) |
| Fornecedor | Nao | Empresa responsavel pela execucao |
| Periodicidade | Sim | Em meses (1 a 120). Determina o vencimento automatico |
| Data Agendada | Sim | Data prevista para execucao |
| Data de Vencimento | Auto/Manual | Calculada automaticamente (data agendada + periodicidade), pode ser ajustada manualmente |
| Observacoes | Nao | Notas adicionais |

> **Auto-preenchimento:** Se o equipamento possui um Tipo de Equipamento configurado, a periodicidade e o fornecedor sao sugeridos automaticamente com base na configuracao do tipo.

### Detalhes da Manutencao

**Rota:** `/manutencoes/[id]`

Exibe todos os dados da manutencao. Acoes disponiveis:

- **Executar** (MASTER, TECNICO): registra a execucao da manutencao com data, custo e observacoes. Cria automaticamente a **proxima manutencao agendada** com base na periodicidade
- **Excluir** (MASTER): remove permanentemente o registro

### Agrupamento por Fornecedor

**Rota:** `/manutencoes/por-fornecedor`

Visualizacao das manutencoes agendadas agrupadas por fornecedor, util para planejamento de visitas tecnicas.

### Ciclo de Vida da Manutencao

```
AGENDADA  -->  REALIZADA  -->  [Nova AGENDADA criada automaticamente]
    |
    v (se dueDate < hoje)
  VENCIDA (exibicao visual, status real permanece AGENDADA)
```

Quando uma manutencao e **executada**:
1. O status muda para REALIZADA
2. A data de execucao e o custo sao registrados
3. Uma nova manutencao AGENDADA e criada automaticamente para o mesmo equipamento, com a data de vencimento calculada pela periodicidade

---

## 8. Chamados Corretivos

**Plano minimo:** PROFISSIONAL

### Listagem de Chamados

**Rota:** `/chamados`
**Permissao:** `ticket.view` (MASTER, TECNICO, COORDENADOR, FISCAL)

Lista todos os chamados com:

- **Filtros**: Status (Aberto, Em Atendimento, Resolvido, Fechado), Urgencia, Equipamento
- **Colunas**: Equipamento, Descricao, Urgencia, Status, Aberto por, Data

### Abertura de Chamado

**Rota:** `/chamados/novo`
**Permissao:** `ticket.create` (MASTER, TECNICO, COORDENADOR)

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Equipamento | Sim | Selecionar da lista (exceto descartados) |
| Descricao do Problema | Sim | Texto descrevendo o defeito ou problema |
| Urgencia | Sim | BAIXA, MEDIA, ALTA ou CRITICA |

### Detalhes do Chamado

**Rota:** `/chamados/[id]`

Exibe todos os dados do chamado com historico completo. Acoes disponiveis conforme o status:

### Ciclo de Vida do Chamado

```
ABERTO  -->  EM_ATENDIMENTO  -->  RESOLVIDO  -->  FECHADO
```

| Acao | Quem pode | De / Para |
|------|-----------|-----------|
| **Aceitar** | MASTER, TECNICO | ABERTO → EM_ATENDIMENTO |
| **Resolver** | MASTER, TECNICO | EM_ATENDIMENTO → RESOLVIDO (registra solucao e custo) |
| **Fechar** | MASTER, TECNICO, COORDENADOR | RESOLVIDO → FECHADO |

Ao **resolver**, o tecnico informa:
- Descricao da solucao aplicada
- Custo do reparo (opcional)

---

## 9. Fisica Medica (RDC 611)

**Plano minimo:** PROFISSIONAL

Modulo dedicado ao gerenciamento de testes de fisica medica conforme a legislacao brasileira (RDC 611, Instrucoes Normativas 90-96).

### Listagem de Testes

**Rota:** `/fisica-medica`
**Permissao:** `physics.view` (MASTER, TECNICO, FISCAL)

- **Filtros**: Status, Tipo de Teste, Equipamento
- **Paginacao**: 20, 50, 100, 150, 200 ou Todos
- **Botao "Sincronizar Seprorad"**: busca documentos da empresa de fisica medica parceira (ver [Integracao Seprorad](#141-seprorad-fisica-medica))

### Tipos de Teste

| Tipo | Descricao |
|------|-----------|
| Controle de Qualidade | Verificacao periodica dos parametros de qualidade |
| Teste de Constancia | Avaliacao da estabilidade do equipamento ao longo do tempo |
| Levantamento Radiometrico | Medicao dos niveis de radiacao no ambiente |
| Teste de Radiacao de Fuga | Verificacao de vazamento de radiacao |

### Novo Teste de Fisica Medica

**Rota:** `/fisica-medica/novo`
**Permissao:** `physics.create` (MASTER, TECNICO)

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Equipamento | Sim | Selecionar da lista |
| Tipo de Teste | Sim | Um dos 4 tipos acima |
| Fornecedor | Nao | Empresa de fisica medica |
| Data Agendada | Sim | Data prevista para realizacao |
| Data de Vencimento | Sim | Data limite (deve ser >= data agendada) |
| Observacoes | Nao | Notas adicionais |

### Detalhes do Teste

**Rota:** `/fisica-medica/[id]`

Exibe todos os dados. Se o teste foi sincronizado do Seprorad, exibe o link para o **laudo em PDF** (visualizado em popup dentro do sistema).

Acoes:
- **Executar** (MASTER, TECNICO): registra a realizacao do teste
- **Excluir** (MASTER): remove o registro

---

## 10. Relatorios

**Rota:** `/relatorios`
**Permissao:** `report.view` (MASTER, TECNICO, FISCAL)

O modulo de relatorios permite gerar e exportar dados em formato **CSV**. Cada relatorio tem um botao "Gerar" e um botao "Exportar CSV".

### Relatorios Disponiveis

| Relatorio | Plano Minimo | Descricao |
|-----------|:------------:|-----------|
| **Inventario Completo** | ESSENCIAL | Lista todos os equipamentos com dados de identificacao, setor, criticidade e aquisicao |
| **Calibracoes Vencidas e a Vencer** | PROFISSIONAL | Manutencoes preventivas vencidas e que vencerao nos proximos 60 dias, ordenadas por urgencia |
| **Historico de Custos por Equipamento** | PROFISSIONAL | Soma dos custos de preventivas e corretivas por equipamento, com percentual sobre o valor de aquisicao |
| **Indicadores de Chamados** | PROFISSIONAL | Tempo medio de atendimento e reincidencia de chamados por equipamento |

---

## 11. Inteligencia Artificial

**Plano minimo:** ENTERPRISE
**Rota:** `/inteligencia`
**Permissao:** `ai.view` (MASTER, TECNICO)

O modulo de inteligencia artificial utiliza agentes de analise que processam os dados do sistema para fornecer **insights estrategicos**. Os agentes analisam:

- Padroes de falha e manutencao
- Equipamentos com maior custo operacional
- Tendencias de vencimentos
- Sugestoes de otimizacao do parque tecnologico

O painel exibe os resultados de forma interativa, permitindo explorar as analises e recomendacoes geradas.

---

## 12. Administracao

**Rota:** `/admin`
**Permissao:** `admin.users` (somente MASTER)

O painel administrativo e acessado pelo menu lateral e contem links para todos os sub-modulos:

### 12.1 Usuarios

**Rota:** `/admin` (painel principal)

Gerenciamento de usuarios do tenant:

- **Listar** usuarios com nome, email, perfil e status
- **Criar** novo usuario com: nome, email, senha, perfil (MASTER, TECNICO, COORDENADOR, FISCAL)
- **Ativar/Desativar** usuarios (usuarios inativos nao conseguem fazer login)

> **Importante:** Apenas o MASTER pode criar e gerenciar usuarios. Nao e possivel excluir usuarios (apenas desativar).

### 12.2 Fornecedores

**Plano minimo:** PROFISSIONAL
**Rota:** `/admin/fornecedores`
**Permissao:** `provider.view/create/edit/delete` (MASTER para tudo, TECNICO para visualizar)

Cadastro de empresas fornecedoras de servicos:

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Nome | Sim | Razao social ou nome fantasia |
| CNPJ | Nao | Cadastro nacional da empresa |
| Telefone | Nao | Telefone de contato |
| Email | Nao | Email de contato |
| Pessoa de contato | Nao | Nome do responsavel |

Acoes: Criar, Editar, Ativar/Desativar.

### 12.3 Tipos de Equipamento

**Plano minimo:** PROFISSIONAL
**Rota:** `/admin/tipos-equipamento`
**Permissao:** `equipmentType.view/create/edit/delete` (MASTER para tudo, TECNICO para visualizar)

Configuracao de tipos de equipamento com periodicidades padrao. Quando um equipamento e cadastrado com um tipo, ele herda as configuracoes.

| Campo | Descricao |
|-------|-----------|
| Nome | Nome do tipo (ex: "Raio-X Digital", "Mamografo") |
| Criticidade padrao | A, B ou C — aplicada automaticamente ao criar equipamento deste tipo |
| Periodicidade Preventiva | Em meses (ex: 12) |
| Periodicidade Calibracao | Em meses (ex: 12) |
| Periodicidade TSE | Em meses (ex: 12) |
| Qtd. Reserva | Quantidade de equipamentos reserva recomendada |
| Fornecedor Preventiva | Fornecedor padrao para preventivas |
| Fornecedor Calibracao | Fornecedor padrao para calibracoes |
| Fornecedor TSE | Fornecedor padrao para TSE |

> **Beneficio:** Ao criar uma manutencao para um equipamento com tipo configurado, o sistema sugere automaticamente o fornecedor e a periodicidade corretos.

### 12.4 Contratos

**Plano minimo:** PROFISSIONAL
**Rota:** `/admin/contratos`
**Permissao:** `contract.view/create/edit/delete` (MASTER para tudo, TECNICO para visualizar)

Gerenciamento de contratos com fornecedores:

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Nome | Sim | Identificacao do contrato |
| Fornecedor | Sim | Empresa contratada |
| Data de Inicio | Sim | Inicio da vigencia |
| Data de Termino | Sim | Fim da vigencia |
| Valor | Nao | Valor do contrato (R$) |
| URL do Documento | Nao | Link para o documento digitalizado |
| Equipamentos | Nao | Equipamentos cobertos pelo contrato |

O sistema indica automaticamente se o contrato esta **ativo** (dentro da vigencia) ou **expirado**.

### 12.5 Importacao de Dados

**Plano minimo:** PROFISSIONAL
**Rota:** `/admin/importar`
**Permissao:** `import.execute` (somente MASTER)

Permite importar equipamentos e manutencoes preventivas em massa a partir de planilha Excel (`.xlsx`).

**Fluxo de importacao:**

1. **Download do template**: baixe o modelo de planilha com as colunas esperadas
2. **Preenchimento**: preencha a planilha com os dados
3. **Upload**: selecione o arquivo `.xlsx` no sistema
4. **Validacao**: o sistema exibe um preview dos dados identificados e erros encontrados
5. **Confirmacao**: confirme a importacao — os dados sao salvos de forma atomica (tudo ou nada)

> **Seguranca:** A importacao e feita dentro de uma transacao. Se houver erro em qualquer linha, nenhum dado e salvo.

---

## 13. Plataforma (Multi-tenant)

**Rota:** `/platform`
**Permissao:** Exclusiva do perfil PLATFORM_ADMIN

Este modulo e restrito ao administrador da plataforma e permite gerenciar todas as instituicoes (tenants) cadastradas.

### Dashboard da Plataforma

**Rota:** `/platform`

Exibe estatisticas globais: total de tenants, usuarios, equipamentos, etc.

### Gestao de Tenants

**Rota:** `/platform/tenants`

Lista todas as instituicoes cadastradas com:
- Nome da instituicao
- CNPJ
- Plano contratado
- Status (ativo/inativo)

### Criar Tenant

**Rota:** `/platform/tenants/novo`

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Nome da Instituicao | Sim | Razao social |
| CNPJ | Sim | CNPJ formatado (normalizado automaticamente) |
| Plano | Sim | ESSENCIAL, PROFISSIONAL ou ENTERPRISE |
| Nome do Admin | Sim | Nome do usuario MASTER inicial |
| Email do Admin | Sim | Email do primeiro usuario |
| Senha do Admin | Sim | Senha do primeiro usuario |

Ao criar o tenant, um usuario MASTER e automaticamente criado para ele.

### Detalhes do Tenant

**Rota:** `/platform/tenants/[id]`

Exibe detalhes da instituicao. Permite:
- Editar nome, CNPJ e plano
- Ativar/Desativar o tenant (tenants inativos bloqueiam login de todos os seus usuarios)

---

## 14. Integracoes

### 14.1 Seprorad (Fisica Medica)

O sistema integra com o **Seprorad**, portal de empresas de fisica medica, para sincronizar documentos e laudos.

**Como funciona:**

1. O administrador configura as variaveis de ambiente `SEPRORAD_DATABASE_URL` e `SEPRORAD_API_KEY`
2. Na tela de Fisica Medica, clique no botao **"Sincronizar Seprorad"**
3. O sistema busca automaticamente os documentos de fisica medica associados aos equipamentos do tenant
4. Os documentos sincronizados aparecem vinculados aos testes com link para o **laudo em PDF**
5. O PDF e exibido em uma popup dentro do sistema (visualizacao segura via proxy)

**Rota da API de sync:** `POST /api/sync-seprorad`
**Rota do proxy de documentos:** `GET /api/seprorad-doc/[docId]`

> **Nota:** A sincronizacao respeita o isolamento multi-tenant — cada instituicao so acessa seus proprios documentos.

### 14.2 Alertas por Email/SMS

O sistema envia alertas automaticos sobre vencimentos de manutencoes e testes.

**Frequencia dos alertas:**
- **60, 30, 20, 15, 10, 5 dias antes** do vencimento
- **No dia** do vencimento
- **A cada 5 dias apos** o vencimento (para servicos vencidos)

**Destinatarios:** Usuarios com perfil MASTER e TECNICO do tenant.

**Tipos de alerta:**
- Vencimento de calibracao/preventiva/TSE
- Vencimento de teste de fisica medica

**Configuracao:**

Os alertas sao disparados por um **cron job** externo que chama:

```
GET /api/alerts/check
Authorization: Bearer {CRON_SECRET}
```

**Canais disponiveis:**
- **Email** (via Resend): configure `RESEND_API_KEY`
- **SMS** (via Twilio): configure `TWILIO_SID` e `TWILIO_AUTH`

---

## 15. Pagina Publica de Equipamento

**Rota:** `/equipamento/[id]`

Pagina publica (sem necessidade de login) que exibe dados basicos de um equipamento. Util para:

- QR Codes colados nos equipamentos (plano ENTERPRISE)
- Compartilhamento de informacoes com auditores externos
- Consulta rapida por tecnicos em campo

---

## 16. Perguntas Frequentes

### Como alterar minha senha?

Atualmente a alteracao de senha e feita pelo administrador (MASTER) do tenant. Solicite ao seu administrador.

### Esqueci minha senha, como recuperar?

Entre em contato com o administrador (MASTER) da sua instituicao para que ele redefina sua senha.

### Por que nao consigo acessar um modulo?

Pode ser por dois motivos:
1. **Seu perfil nao tem permissao** — verifique com o MASTER da instituicao
2. **O plano da instituicao nao inclui** — a funcionalidade requer upgrade de plano

### Como funciona o vencimento automatico?

Quando uma manutencao e agendada, a data de vencimento e calculada como: `data agendada + periodicidade (em meses)`. Se a data de vencimento passa sem que o servico seja executado, a manutencao aparece como "Vencida" no sistema.

### O que acontece quando executo uma manutencao?

1. O status muda para "Realizada"
2. Voce registra a data de execucao, custo e observacoes
3. O sistema cria automaticamente uma **nova manutencao agendada** com a periodicidade configurada

### Como importar dados de uma planilha?

1. Va em Administracao > Importar Dados
2. Baixe o template Excel
3. Preencha com seus dados
4. Faca upload do arquivo
5. Revise o preview e confirme

### Quantos usuarios posso ter?

Nao ha limite de usuarios por tenant. O MASTER pode criar quantos usuarios forem necessarios.

### O sistema funciona no celular?

Sim. O sistema possui layout responsivo que se adapta a telas de celular e tablet. As tabelas sao substituidas por cards em telas menores.

---

## Glossario

| Termo | Significado |
|-------|------------|
| **Tenant** | Instituicao/empresa cadastrada na plataforma |
| **Parque Tecnologico** | Conjunto de equipamentos medico-hospitalares de uma instituicao |
| **Criticidade** | Nivel de importancia: A (Critico), B (Moderado), C (Baixo) |
| **TSE** | Teste de Seguranca Eletrica |
| **RDC 611** | Resolucao da Anvisa sobre controle de qualidade em equipamentos de radiacao |
| **Calibracao** | Procedimento para verificar e ajustar a precisao de um equipamento |
| **Preventiva** | Manutencao programada para evitar falhas |
| **Corretiva** | Manutencao realizada apos identificacao de defeito |
| **Seprorad** | Portal de empresas de fisica medica para laudos e documentos |
| **SaaS** | Software como Servico — acessado via navegador, sem instalacao |
| **Multi-tenant** | Arquitetura onde uma unica instancia atende multiplas instituicoes com dados isolados |

---

*Manual gerado para o sistema Vitalis (Engclin) — Gestao de Equipamentos Medico-Hospitalares*
