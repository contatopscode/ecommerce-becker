// ============================================================
// Checkout Becker — Sprint 1
// - Identificação por WhatsApp (sem login)
// - CEP automático (ViaCEP)
// - Reutilizar endereço do último pedido
// - Cupom 15% OFF primeira compra automático
// - Frete por peso (configurável no Admin)
// ============================================================

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CustomerData {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  cpfCnpj?: string;
  address: any;
  orderCount: number;
  isFirstPurchase: boolean;
}

interface ShippingOption {
  id: 'free' | 'standard' | 'express';
  name: string;
  description: string;
  price: number;
  days: string;
  carrier: string;
}

const STEPS = [
  { id: 1, name: 'Identificação' },
  { id: 2, name: 'Endereço' },
  { id: 3, name: 'Entrega' },
  { id: 4, name: 'Pagamento' },
];

function onlyDigits(s: string) { return (s || '').replace(/\D/g, ''); }
function formatWhatsApp(v: string) {
  v = onlyDigits(v).slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}
function formatCep(v: string) {
  v = onlyDigits(v).slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0, 5)}-${v.slice(5)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Form state
  const [whatsapp, setWhatsapp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [cupom, setCupom] = useState('');
  const [cupomApplied, setCupomApplied] = useState<{ code: string; discount: number } | null>(null);

  // Empty cart check
  useEffect(() => {
    if (cart.items.length === 0) {
      router.push('/carrinho');
    }
  }, [cart.items.length]);

  // Calcula totais
  const subtotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0),
    [cart.items]
  );
  const shipping = shippingOption?.price || 0;
  const discount = cupomApplied ? (subtotal * cupomApplied.discount / 100) : 0;
  const total = subtotal - discount + shipping;

  // ============ AUTOCOMPLETE CEP ============
  const fetchCep = useCallback(async (cepValue: string) => {
    const cleaned = onlyDigits(cepValue);
    if (cleaned.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`/api/cep?cep=${cleaned}`);
      const data = await res.json();
      if (data.ok && data.address) {
        const a = data.address as AddressData;
        setStreet(a.street);
        setNeighborhood(a.neighborhood);
        setCity(a.city);
        setStateUF(a.state);
        toast('Endereço encontrado ✓', 'success');
      } else {
        toast('CEP não encontrado. Preencha manualmente.', 'error');
      }
    } catch {
      toast('Erro ao buscar CEP', 'error');
    }
    setCepLoading(false);
  }, []);

  // ============ BUSCA CLIENTE POR WHATSAPP ============
  const searchByWhatsapp = useCallback(async (phone: string) => {
    const cleaned = onlyDigits(phone);
    if (cleaned.length < 10) return;

    setSearchingCustomer(true);
    try {
      const res = await fetch(`/api/customer/by-whatsapp?whatsapp=${cleaned}`);
      const data = await res.json();

      if (data.ok && data.customer) {
        setCustomer(data.customer);
        // Se é lead novo, deixa campo nome vazio pra digitar
        if (!data.customer.isNewLead) {
          setName(data.customer.name);
        } else {
          setName('');
        }
        if (data.customer.email) setEmail(data.customer.email);
        if (data.customer.address) {
          setCep(data.customer.address.cep || '');
          setStreet(data.customer.address.street || '');
          setNumber(data.customer.address.number || '');
          setComplement(data.customer.address.complement || '');
          setNeighborhood(data.customer.address.neighborhood || '');
          setCity(data.customer.address.city || '');
          setStateUF(data.customer.address.state || '');
        }
        if (data.customer.isNewLead) {
          toast('✨ Quase lá! Só falta seu nome pra continuar', 'info');
        } else if (data.customer.isFirstPurchase) {
          setCupomApplied({ code: 'BEMVINDO15', discount: 15 });
          toast(`🎁 Olá ${data.customer.name.split(' ')[0]}! 15% OFF na primeira compra!`, 'success');
        } else {
          toast(`Bem-vindo de volta, ${data.customer.name.split(' ')[0]}!`, 'success');
        }

        // SPRINT 4: NÃO pula automaticamente (cliente pode querer outro endereço)
        // Só vai pro step 2 (que tem o endereço pré-preenchido pra editar)
        if (
          !data.customer.isNewLead &&
          !data.customer.isFirstPurchase &&
          data.customer.address?.cep
        ) {
          // Avança pro step 2 com endereço pré-preenchido
          // Cliente pode editar se quiser mandar pra outro lugar
          setStep(2);
          toast('📍 Seu último endereço está preenchido. Quer enviar pra outro lugar?', 'info');
        }
      } else {
        setCustomer(null);
        toast(data.error || 'Erro ao buscar cliente', 'error');
      }
    } catch (e) {
      console.error('Erro buscar cliente:', e);
      toast('Erro de conexão ao buscar cliente', 'error');
    }
    setSearchingCustomer(false);
  }, []);

  // Auto-trigger busca quando whatsapp tiver 11 dígitos
  useEffect(() => {
    const cleaned = onlyDigits(whatsapp);
    if (cleaned.length === 11) {
      searchByWhatsapp(cleaned);
    }
  }, [whatsapp, searchByWhatsapp]);

  // Auto-trigger CEP quando tiver 8 dígitos
  useEffect(() => {
    const cleaned = onlyDigits(cep);
    if (cleaned.length === 8 && !street) {
      fetchCep(cleaned);
    }
  }, [cep, street, fetchCep]);

  // ============ CÁLCULO DE FRETE ============
  const calculateShipping = useCallback(async () => {
    if (onlyDigits(cep).length !== 8) return;
    if (cart.items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: onlyDigits(cep),
          items: cart.items.map((i) => ({ versionId: i.versionId, qty: i.qty })),
          orderTotal: subtotal,
        }),
      });
      const data = await res.json();
      if (data.ok && data.options?.length > 0) {
        setShippingOption(data.options[0]);
        toast('Frete calculado ✓', 'success');
      } else {
        toast('Não foi possível calcular o frete', 'error');
      }
    } catch {
      toast('Erro ao calcular frete', 'error');
    }
    setLoading(false);
  }, [cep, cart.items, subtotal]);

  // ============ CUPOM ============
  const applyCupon = async () => {
    if (!cupom.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cupom/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cupom.toUpperCase(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setCupomApplied({ code: data.coupon.code, discount: data.coupon.percent });
        toast(`Cupom ${data.coupon.code} aplicado! ${data.coupon.percent}% OFF`, 'success');
      } else {
        toast(data.error || 'Cupom inválido', 'error');
      }
    } catch {
      toast('Erro ao validar cupom', 'error');
    }
    setLoading(false);
  };

  // ============ SUBMIT PEDIDO ============
  const submitOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        whatsapp: onlyDigits(whatsapp),
        name,
        email: email || undefined,
        cep: onlyDigits(cep),
        street, number, complement, neighborhood, city, state: stateUF,
        shipping: shippingOption,
        paymentMethod,
        cupom: cupomApplied?.code,
        items: cart.items,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();

      if (data.ok) {
        cart.clear();
        toast('Pedido criado! Agora é só pagar 💜', 'success');
        router.push(`/checkout/pagamento?orderId=${data.orderId}`);
      } else {
        toast(data.error || 'Erro ao criar pedido', 'error');
      }
    } catch {
      toast('Erro ao processar pedido', 'error');
    }
    setLoading(false);
  };

  // ============ SALVAR PROGRESSO ============
  const saveProgress = useCallback(async (stepNum: number) => {
    if (onlyDigits(whatsapp).length < 10) return;

    try {
      const data: any = {
        step: stepNum,
        whatsapp: onlyDigits(whatsapp),
        name: name || undefined,
        email: email || undefined,
      };
      if (stepNum >= 2) {
        data.cep = onlyDigits(cep);
        data.street = street;
        data.number = number;
        data.complement = complement;
        data.neighborhood = neighborhood;
        data.city = city;
        data.state = stateUF;
      }
      await fetch('/api/checkout/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Save progress error:', e);
      // Não bloqueia o fluxo
    }
  }, [whatsapp, name, email, cep, street, number, complement, neighborhood, city, stateUF]);

  // Salvar automaticamente ao completar cada step
  useEffect(() => {
    // Step 1: tem whatsapp + nome
    if (step === 1 && onlyDigits(whatsapp).length >= 10 && name.length > 1) {
      const t = setTimeout(() => saveProgress(1), 800);
      return () => clearTimeout(t);
    }
    // Step 2: tem CEP + rua + número + bairro + cidade + UF
    if (
      step === 2 &&
      onlyDigits(cep).length === 8 &&
      street && number && neighborhood && city && stateUF
    ) {
      const t = setTimeout(() => saveProgress(2), 800);
      return () => clearTimeout(t);
    }
  }, [step, whatsapp, name, cep, street, number, neighborhood, city, stateUF, saveProgress]);

  // ============ VALIDAÇÃO POR STEP ============
  const canProceed = () => {
    if (step === 1) return onlyDigits(whatsapp).length >= 10 && name.length > 1;
    if (step === 2) {
      return onlyDigits(cep).length === 8 && street && number && neighborhood && city && stateUF;
    }
    if (step === 3) return shippingOption !== null;
    return true;
  };

  if (cart.items.length === 0) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="bg-becker-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  step >= s.id ? 'text-becker-purple' : 'text-becker-slate'
                }`}>
                  <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold ${
                    step > s.id ? 'bg-eco-500 text-white' :
                    step === s.id ? 'bg-becker-purple text-white' : 'bg-becker-line'
                  }`}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <span className="font-semibold text-sm hidden sm:inline">{s.name}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    step > s.id ? 'bg-eco-500' : 'bg-becker-line'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coluna principal - formulário */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 lg:p-8 border border-becker-line">

                {/* STEP 1: Identificação */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Quem é você?</h2>
                    <p className="text-becker-slate text-sm mb-6">
                      Só precisamos do seu WhatsApp. Se você já comprou, trazemos seus dados. ✨
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">WhatsApp *</label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                            placeholder="(81) 99999-9999"
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 text-lg focus:border-becker-purple outline-none"
                            autoFocus
                          />
                          {searchingCustomer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-becker-purple border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {customer && (
                          <div className="mt-2 p-3 bg-eco-50 border border-eco-200 rounded-xl text-sm text-eco-700">
                            <strong>✓ Olá, {customer.name}!</strong> Buscamos seus dados.
                            {customer.orderCount > 0 && ` Você tem ${customer.orderCount} pedido(s) anterior(es).`}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-1">Nome completo *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Como devemos te chamar?"
                          className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-1">E-mail (opcional)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                        />
                        <p className="text-xs text-becker-slate mt-1">Para enviar a confirmação do pedido</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Endereço */}
                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Endereço de entrega</h2>
                    <p className="text-becker-slate text-sm mb-4">
                      Digite seu CEP e completamos o resto automaticamente ✨
                    </p>

                    {/* Badge: veio preenchido */}
                    {customer && !customer.isNewLead && customer.address?.cep && (
                      <div className="mb-6 p-3 bg-eco-50 border border-eco-200 rounded-xl flex items-start gap-3 text-sm">
                        <span className="text-2xl">📍</span>
                        <div className="flex-1">
                          <div className="font-bold text-eco-700">Seu último endereço</div>
                          <div className="text-eco-600 text-xs mt-0.5">
                            {customer.address.street}, {customer.address.number} — {customer.address.city}/{customer.address.state}
                          </div>
                          <div className="mt-2 text-xs text-becker-slate">
                            ✏️ Edite os campos abaixo se quiser enviar pra outro lugar
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">CEP *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cep}
                            onChange={(e) => setCep(formatCep(e.target.value))}
                            placeholder="50000-000"
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                            maxLength={9}
                          />
                          {cepLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-becker-purple border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold mb-1">Rua *</label>
                          <input
                            type="text"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Número *</label>
                          <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="123"
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-1">Complemento (opcional)</label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto 101, Bloco A, Casa 2..."
                          className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-sm font-semibold mb-1">Bairro *</label>
                          <input
                            type="text"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Cidade *</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">UF *</label>
                          <input
                            type="text"
                            value={stateUF}
                            onChange={(e) => setStateUF(e.target.value.toUpperCase().slice(0, 2))}
                            maxLength={2}
                            className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Frete */}
                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Forma de entrega</h2>
                    <p className="text-becker-slate text-sm mb-6">
                      Frete grátis acima de 5kg de pedido 🆓
                    </p>

                    {!shippingOption ? (
                      <button
                        onClick={calculateShipping}
                        disabled={loading || onlyDigits(cep).length !== 8}
                        className="w-full bg-becker-purple text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                      >
                        {loading ? 'Calculando...' : 'Calcular frete'}
                      </button>
                    ) : (
                      <ShippingOptions
                        current={shippingOption}
                        onSelect={setShippingOption}
                        reloadFn={calculateShipping}
                      />
                    )}
                  </div>
                )}

                {/* STEP 4: Pagamento */}
                {step === 4 && (
                  <div>
                    <h2 className="text-2xl font-extrabold mb-2">Como você quer pagar?</h2>
                    <p className="text-becker-slate text-sm mb-6">
                      Escolha a forma mais prática pra você
                    </p>

                    <div className="space-y-3 mb-6">
                      <PaymentOption
                        selected={paymentMethod === 'pix'}
                        onClick={() => setPaymentMethod('pix')}
                        title="PIX"
                        description="Aprovação instantânea • 5% OFF adicional"
                        badge="Recomendado"
                      />
                      <PaymentOption
                        selected={paymentMethod === 'credit_card'}
                        onClick={() => setPaymentMethod('credit_card')}
                        title="Cartão de Crédito"
                        description="Até 3x sem juros"
                      />
                    </div>

                    {/* Cupom */}
                    <div className="border-t border-becker-line pt-6">
                      <h3 className="font-semibold mb-2">Cupom de desconto</h3>
                      {cupomApplied ? (
                        <div className="flex items-center justify-between bg-eco-50 border border-eco-200 rounded-xl p-3">
                          <div>
                            <div className="font-bold text-eco-700">✓ {cupomApplied.code}</div>
                            <div className="text-xs text-eco-600">{cupomApplied.discount}% de desconto aplicado</div>
                          </div>
                          <button
                            onClick={() => { setCupomApplied(null); setCupom(''); }}
                            className="text-xs text-red-600 font-semibold hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={cupom}
                            onChange={(e) => setCupom(e.target.value.toUpperCase())}
                            placeholder="CODIGO"
                            className="flex-1 border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
                          />
                          <button
                            onClick={applyCupon}
                            disabled={loading || !cupom}
                            className="bg-becker-line text-becker-ink font-semibold px-4 rounded-xl disabled:opacity-50"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-becker-slate">
                      <div className="flex flex-col items-center gap-1 p-2">
                        <span className="text-2xl">🔒</span>
                        <span>Pagamento seguro</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2">
                        <span className="text-2xl">🚚</span>
                        <span>Entrega garantida</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2">
                        <span className="text-2xl">💜</span>
                        <span>40 anos cuidando</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de navegação */}
                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex-1 border-2 border-becker-line text-becker-ink font-semibold py-3 rounded-xl hover:bg-becker-cream"
                    >
                      ← Voltar
                    </button>
                  )}
                  {step < 4 ? (
                    <button
                      onClick={() => {
                        if (step === 3 && !shippingOption) calculateShipping();
                        setStep(step + 1);
                      }}
                      disabled={!canProceed()}
                      className="flex-1 bg-becker-purple text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar →
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={submitOrder}
                        disabled={loading}
                        className="flex-1 bg-eco-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                      >
                        {loading ? 'Processando...' : 'Finalizar pedido'}
                      </button>
                      <button
                        onClick={async () => {
                          // Cria pedido e abre WhatsApp com mensagem
                          setLoading(true);
                          try {
                            const orderData = {
                              whatsapp: onlyDigits(whatsapp), name, email: email || undefined,
                              cep: onlyDigits(cep), street, number, complement, neighborhood, city, state: stateUF,
                              shipping: shippingOption, paymentMethod, cupom: cupomApplied?.code, items: cart.items,
                            };
                            const res = await fetch('/api/orders/create', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(orderData),
                            });
                            const data = await res.json();
                            if (data.ok) {
                              cart.clear();
                              const msg = encodeURIComponent(
                                `Oi! Acabei de fazer o pedido *${data.orderNumber}* no site Becker. Pode me ajudar a finalizar o pagamento?`
                              );
                              window.open(`https://wa.me/5581999022262?text=${msg}`, '_blank');
                              router.push(`/checkout/pagamento?orderId=${data.orderId}`);
                            } else {
                              toast(data.error || 'Erro', 'error');
                            }
                          } catch {
                            toast('Erro de conexão', 'error');
                          }
                          setLoading(false);
                        }}
                        disabled={loading}
                        className="bg-[#25D366] text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50"
                        title="Finalizar pelo WhatsApp"
                      >
                        💬
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo lateral */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-becker-line sticky top-4">
                <h3 className="font-extrabold text-lg mb-4">Resumo do pedido</h3>

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <div className="w-12 h-12 bg-becker-cream rounded-lg grid place-items-center overflow-hidden p-0.5">
                        {item.image && <img src={item.image} alt="" className="max-h-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold line-clamp-1">{item.name}</div>
                        <div className="text-xs text-becker-slate">{item.qty}x {formatPrice(item.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-becker-line pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-eco-600">
                      <span>Desconto {cupomApplied?.code}</span>
                      <span className="font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-eco-600">Grátis 🎁</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  <div className="border-t border-becker-line pt-3 flex justify-between text-lg font-extrabold">
                    <span>Total</span>
                    <span className="text-becker-purple">{formatPrice(total)}</span>
                  </div>
                  <div className="text-xs text-becker-slate text-right">
                    em até 3x sem juros de {formatPrice(total / 3)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

function ShippingOptions({ current, onSelect, reloadFn }: any) {
  return (
    <div className="space-y-3">
      <div className="border-2 border-becker-purple bg-becker-purple-soft rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">{current.name}</div>
            <div className="text-sm text-becker-slate">{current.description} • {current.days}</div>
            <div className="text-xs text-becker-slate mt-1">Via {current.carrier}</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-extrabold ${current.price === 0 ? 'text-eco-600' : 'text-becker-ink'}`}>
              {current.price === 0 ? 'Grátis' : formatPrice(current.price)}
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={reloadFn}
        className="text-xs text-becker-purple hover:underline"
      >
        ↻ Recalcular com outro CEP
      </button>
    </div>
  );
}

function PaymentOption({ selected, onClick, title, description, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition ${
        selected
          ? 'border-becker-purple bg-becker-purple-soft'
          : 'border-becker-line hover:border-becker-purple/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold flex items-center gap-2">
            {title}
            {badge && (
              <span className="text-[10px] font-bold bg-eco-500 text-white px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <div className="text-xs text-becker-slate mt-0.5">{description}</div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 ${
          selected ? 'border-becker-purple bg-becker-purple' : 'border-becker-line'
        }`}>
          {selected && <div className="w-full h-full grid place-items-center text-white text-xs">✓</div>}
        </div>
      </div>
    </button>
  );
}
