---
hu_id: HU001
status: Aprovado
release: v1.0
modulo: Catalogo
prioridade: Alta
demanda: becker-ecommerce
---

### HU001 — Navegando pelo catálogo de produtos

**Como:** visitante (cliente final) acessando a loja pelo celular
**Quero:** ver todos os produtos disponíveis organizados por categoria
**Para que:** escolher produtos de limpeza de forma fácil e visual

#### Critérios de Aceitação
1. A página inicial deve listar todas as categorias ativas em cards visuais
2. Cada card de categoria deve mostrar: nome, ícone, contagem de produtos, cor personalizada
3. Clicar em uma categoria deve navegar para `/categoria/[slug]`
4. Categorias devem ser ordenadas pelo campo `order` (crescente)
5. Apenas categorias com `active = true` devem aparecer
6. Categorias sem produtos não devem aparecer (ou mostrar "em breve")

#### Requisitos Funcionais

##### Listagem de Categorias na Home
A página `/` (home) deve:
- Buscar todas as categorias ativas via Prisma
- Renderizar grid responsivo (2 colunas mobile, 4 desktop)
- Cada card linka para `/categoria/[slug]`
- Mostrar contagem de produtos ativos por categoria

##### Navegação por Slug
A rota `/categoria/[slug]` deve:
- Buscar categoria por slug
- Se não existir ou `active = false`, retornar 404
- Listar produtos da categoria em grid

#### Regras de Negócio
- **RN01** — Apenas categorias com `active = true` E com pelo menos 1 produto ativo aparecem
- **RN02** — Ordem de exibição definida por `Category.order` (menor = primeiro)
- **RN03** — Categorias com `icon` nulo devem mostrar ícone padrão (emoji genérico)

#### Fluxos de Exceção
- **Categoria sem produtos:** mostrar card com badge "Em breve" e desabilitar clique
- **Slug inválido:** mostrar página 404
- **Erro de banco:** mostrar mensagem "Erro ao carregar" com botão "Tentar novamente"

#### Dependências
- Nenhuma
