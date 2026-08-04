// ============================================================
// Checkout - 1 página
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, toast } from '@/lib/cart';
import { formatPrice, maskCep, maskWhatsApp } from '@/lib/utils';
import { createOrderAction, calcShippingAction } from '@/lib/actions';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart.items;
  const subtotal = cart.subtotal();
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'pac' | 'sedex' | 'free'>('free');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');

  const shippingPrice = 0; // Frete grátis por padrão
  const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const total = Math.max(0, subtotal - discount) + shippingPrice;

  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    cpfCnpj: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: 'SP',
    acceptMarketing: true,
  });

  if (items.length === 0) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="text-center">
          <h1 className="display text-2xl font-extrabold mb-2">Carrinho vazio</h1>
          <Link href="/" className="inline-block mt-4 bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full">
            Ver produtos
          </Link>
        </div>
      </main>
    );
  }

  const fillAddressByCep = async () => {
    if (form.cep.replace(/\D/g, '').length !== 8) {
      toast('Digite um CEP válido', 'error');
      return;
    }
    // Simulação ViaCEP (em produção: fetch real)
    const mock: Record<string, any> = {
      '01310000': { rua: 'Av. Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
      '20000000': { rua: 'Av. Rio Branco', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ' },
    };
    const cleaned = form.cep.replace(/\D/g, '');
    const data = mock[cleaned] || { rua: 'Av. Brasil', bairro: 'Centro', cidade: 'Sua Cidade', estado: 'SP' };
    setForm({ ...form, street: data.rua, district: data.bairro, city: data.cidade, state: data.estado });
    toast('Endereço preenchido!', 'success');
  };

  const placeOrder = async () => {
    // Validações
    if (!form.name.trim()) return toast('Digite seu nome', 'error');
    if (form.whatsapp.replace(/\D/g, '').length < 10) return toast('WhatsApp inválido', 'error');
    if (form.cep.replace(/\D/g, '').length !== 8) return toast('CEP inválido', 'error');
    if (!form.street.trim()) return toast('Endereço incompleto', 'error');
    if (!form.number.trim()) return toast('Número obrigatório', 'error');

    setLoading(true);
    try {
      const result = await createOrderAction({
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement || undefined,
        district: form.district,
        city: form.city,
        state: form.state,
        shippingMethod,
        shippingPrice,
        shippingDays: '5 a 9 dias úteis',
        paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          versionId: i.versionId,
          qty: i.qty,
        })),
        acceptMarketing: form.acceptMarketing,
      });

      if (result.success) {
        cart.clear();
        toast('Pedido criado!', 'success');
        router.push(`/pedido/${result.orderId}`);
      }
    } catch (e: any) {
      toast(e.message || 'Erro ao criar pedido', 'error');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-becker-cream">
      {/* Header minimalista */}
      <header className="bg-white border-b border-becker-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-becker-purple grid place-items-center text-white font-bold">B</div>
            <span className="display font-extrabold text-lg text-becker-purple">Becker</span>
          </Link>
          <div className="text-sm text-becker-slate flex items-center gap-2">🔒 Compra 100% segura</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-becker-orange/10 border border-becker-orange/30 rounded-2xl p-4 flex items-start gap-3 text-sm">
            <span className="text-2xl">✨</span>
            <div><strong>Sem cadastro prévio!</strong> Você preenche só o essencial. Sua conta será criada automaticamente.</div>
          </div>

          {/* Dados */}
          <section className="bg-white rounded-2xl border border-becker-line p-6">
            <h2 className="display text-xl font-extrabold mb-4">Seus dados</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Como devemos te chamar?"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple"
                />
              </div>
              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: maskWhatsApp(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple"
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Para receber a NF-e"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple"
                />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptMarketing}
                onChange={(e) => setForm({ ...form, acceptMarketing: e.target.checked })}
                className="w-4 h-4 rounded text-becker-purple"
              />
              Quero receber ofertas exclusivas por WhatsApp
            </label>
          </section>

          {/* Endereço */}
          <section className="bg-white rounded-2xl border border-becker-line p-6">
            <h2 className="display text-xl font-extrabold mb-4">Endereço de entrega</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">CEP</label>
                <input
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: maskCep(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Rua</label>
                <input
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="Av. Paulista"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 bg-becker-cream"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Número</label>
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="1000"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 bg-becker-cream"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Complemento</label>
                <input
                  value={form.complement}
                  onChange={(e) => setForm({ ...form, complement: e.target.value })}
                  placeholder="Apto 12"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bairro</label>
                <input
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Bela Vista"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 bg-becker-cream"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Cidade</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 bg-becker-cream"
                />
              </div>
              <div>
                <label className="text-sm font-medium">UF</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full mt-1 border border-becker-line rounded-xl px-4 py-3 bg-becker-cream"
                >
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={fillAddressByCep} className="mt-3 text-sm text-becker-purple font-semibold hover:underline">
              📍 Preencher pelo CEP
            </button>
          </section>

          {/* Frete */}
          <section className="bg-white rounded-2xl border border-becker-line p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="display text-xl font-extrabold">Forma de envio</h2>
              <span className="text-xs font-bold text-eco-600 bg-eco-50 px-2 py-1 rounded-full">FRETE GRÁTIS ATIVO</span>
            </div>
            <label className="flex items-center gap-3 border-2 border-eco-500 bg-eco-50 rounded-xl p-4 cursor-pointer">
              <input type="radio" name="frete" checked={shippingMethod === 'free'} onChange={() => setShippingMethod('free')} />
              <div className="flex-1">
                <div className="font-semibold">🚚 Frete Grátis — Entrega padrão</div>
                <div className="text-xs text-becker-slate">5 a 9 dias úteis · Brasil todo</div>
              </div>
              <div className="display font-extrabold text-eco-600">Grátis</div>
            </label>
          </section>

          {/* Pagamento */}
          <section className="bg-white rounded-2xl border border-becker-line p-6">
            <h2 className="display text-xl font-extrabold mb-4">Pagamento</h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {([
                { id: 'pix', icon: '⚡', label: 'Pix', extra: '5% off' },
                { id: 'credit_card', icon: '💳', label: 'Cartão', extra: '3x sem juros' },
                { id: 'boleto', icon: '📄', label: 'Boleto', extra: 'à vista' },
              ] as const).map((p) => (
                <label
                  key={p.id}
                  className={`rounded-xl p-4 cursor-pointer text-center transition border-2 ${
                    paymentMethod === p.id
                      ? 'border-becker-purple bg-becker-purple/5'
                      : 'border-becker-line hover:border-becker-purple'
                  }`}
                >
                  <input
                    type="radio"
                    name="pag"
                    checked={paymentMethod === p.id}
                    onChange={() => setPaymentMethod(p.id)}
                    className="hidden"
                  />
                  <div className="text-2xl">{p.icon}</div>
                  <div className="font-semibold text-sm mt-1">{p.label}</div>
                  <div className="text-[10px] text-becker-slate">{p.extra}</div>
                </label>
              ))}
            </div>
            {paymentMethod === 'pix' && (
              <div className="bg-eco-50 border border-eco-200 rounded-xl p-3 text-sm text-eco-700 font-semibold flex items-center gap-2">
                🎉 Você economiza {formatPrice(discount)} pagando com Pix
              </div>
            )}
          </section>
        </div>

        {/* Resumo */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-becker-line p-6 sticky top-4">
            <h3 className="display text-lg font-extrabold mb-4">Resumo</h3>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((i) => (
                <div key={`${i.productId}-${i.versionId}`} className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-becker-purple-soft grid place-items-center shrink-0 overflow-hidden p-1">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{i.name}</div>
                    <div className="text-xs text-becker-slate">{i.versionLabel} · Qtd: {i.qty}</div>
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">{formatPrice((i.price || 0) * i.qty)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-becker-line pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-becker-slate">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-becker-slate">Frete</span><span className="text-eco-600 font-semibold">Grátis</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-eco-600 font-semibold"><span>Desconto Pix (5%)</span><span>−{formatPrice(discount)}</span></div>
              )}
            </div>
            <div className="border-t border-becker-line pt-3 mt-3 flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="display text-2xl font-extrabold text-becker-purple">{formatPrice(total)}</span>
            </div>
            <div className="text-xs text-becker-slate text-right">em até 3x de {formatPrice(total / 3)} sem juros</div>

            <button
              onClick={placeOrder}
              disabled={loading}
              className="w-full mt-5 bg-becker-orange hover:brightness-95 transition text-white font-bold py-4 rounded-full text-lg shadow-pop disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar pedido'}
            </button>
            <p className="text-[11px] text-center text-becker-slate mt-3">Ao confirmar, você concorda com nossos termos.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
