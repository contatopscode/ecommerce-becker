---
hu_id: HU013
status: Aprovado
release: v1.0
modulo: Checkout
prioridade: Alta
demanda: becker-ecommerce
---

### HU013 — Finalizando compra via checkout 4 steps

**Como:** cliente com produtos no carrinho
**Quero:** finalizar a compra passando por 4 etapas claras (identificação, endereço, frete, pagamento)
**Para que:** receber meus produtos em casa com segurança e rastreamento

#### Critérios de Aceitação
1. Checkout deve ter 4 steps visuais com indicador de progresso
2. Step 1: cliente digita WhatsApp (sistema detecta se é recorrente)
3. Step 2: cliente digita CEP e sistema auto-preenche endereço via ViaCEP
4. Step 3: sistema calcula frete baseado em CEP + peso (PAC, SEDEX, Grátis)
5. Step 4: cliente escolhe forma de pagamento (PIX, Cartão, Boleto)
6. Cliente pode voltar steps anteriores sem perder dados
7. Sistema salva progresso automaticamente (não perder se fechar aba)
8. Pedido é criado ao confirmar pagamento (status PENDING)

#### Requisitos Funcionais

##### Step 1 — Identificação
- Input WhatsApp com máscara `(XX) XXXXX-XXXX`
- Auto-detecta cliente existente (busca por `User.whatsapp`)
- Se cliente existente: pula step 2 e 3 (endereço + frete pré-preenchidos)
- Se novo: cria lead (pré-cadastro)

##### Step 2 — Endereço
- Input CEP com máscara `XXXXX-XXX`
- Auto-preencher via ViaCEP ao completar CEP
- Campos: rua, número, complemento, bairro, cidade, UF
- Validação de campos obrigatórios

##### Step 3 — Frete
- Calcular opções baseado em CEP + peso total
- Mostrar: PAC, SEDEX, Frete Grátis (se aplicável)
- Cada opção com: preço, prazo, transportadora
- Cliente seleciona 1 opção

##### Step 4 — Pagamento
- Escolha: PIX / Cartão / Boleto
- ⚠️ **Pagamento é SIMULADO** (Sprint 6 trará gateway real)
- Aplicar cupom se houver
- Mostrar resumo: subtotal, frete, desconto, total
- Botão "Finalizar pedido" cria `Order` com `status = PENDING`

#### Regras de Negócio
- **RN01** — Pedido mínimo: R$ 10,00
- **RN02** — Frete grátis quando subtotal ≥ R$ 199 (configurável)
- **RN03** — Apenas clientes recorrentes (com cadastro) podem pular steps
- **RN04** — Salvar progresso a cada step (recuperação ao reabrir)
- **RN05** — Decrementar estoque ao criar pedido (não no pagamento)

#### Fluxos de Exceção
- **CEP inválido:** mostrar erro e pedir para corrigir
- **Estoque insuficiente:** impedir finalizar, mostrar qual item está sem estoque
- **Erro ao criar pedido:** manter dados do checkout, mostrar mensagem de erro
- **Conexão perdida:** salvar localmente, sincronizar depois
- **Pagamento falha (Sprint 6):** manter pedido em PENDING, permitir tentar de novo

#### Dependências
- HU014 (identificação WhatsApp)
- HU015 (endereço ViaCEP)
- HU016 (cálculo frete)
- HU017 (cupom)
- HU018 (salvar progresso)
- HU019 (lead capture)
- HU020 (criar pedido)
- HU042 (pagamento real — Sprint 6)
