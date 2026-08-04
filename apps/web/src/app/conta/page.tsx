// ============================================================
// Login / Conta
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { maskWhatsApp } from '@/lib/utils';
import { toast } from '@/lib/cart';

type Step = 'phone' | 'code' | 'logged';

export default function ContaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Se já logado, redireciona
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.session) {
          setSession(d.session);
          setStep('logged');
        }
      });
  }, []);

  // Timer de reenvio
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const requestCode = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      toast('WhatsApp inválido', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: phone }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('Código enviado por WhatsApp!', 'success');
        if (data.code) {
          toast(`(dev) código: ${data.code}`, 'info');
        }
        setStep('code');
        setResendTimer(60);
      } else {
        toast(data.error || 'Erro ao enviar código', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast('Código deve ter 6 dígitos', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: phone, code }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('Login realizado! 🎉', 'success');
        setSession(data.session);
        setStep('logged');
        router.refresh();
      } else {
        toast(data.error || 'Código inválido', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setLoading(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setStep('phone');
    setCode('');
    setPhone('');
    toast('Sessão encerrada', 'info');
    router.refresh();
  };

  // LOGADO
  if (step === 'logged' && session) {
    return <ContaLogada session={session} onLogout={logout} />;
  }

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl gradient-purple mx-auto grid place-items-center text-white text-2xl mb-3">
              {step === 'code' ? '🔐' : '👤'}
            </div>
            <h1 className="display text-2xl font-extrabold">
              {step === 'phone' ? 'Entrar na Becker' : 'Confirme seu código'}
            </h1>
            <p className="text-becker-slate text-sm">
              {step === 'phone'
                ? 'Acesse com seu WhatsApp'
                : `Enviamos um código de 6 dígitos para ${phone}`
              }
            </p>
          </div>

          {step === 'phone' && (
            <div className="space-y-3">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(maskWhatsApp(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple"
                autoFocus
              />
              <button
                onClick={requestCode}
                disabled={loading}
                className="w-full bg-becker-purple text-white font-semibold py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar código por WhatsApp'}
              </button>
              <div className="text-center text-sm text-becker-slate">ou</div>
              <button className="w-full border border-becker-line text-becker-ink font-semibold py-3 rounded-full">
                Continuar com Google
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-3xl font-mono tracking-widest border border-becker-line rounded-xl px-4 py-4 focus:outline-none focus:border-becker-purple"
                autoFocus
              />
              <button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="w-full bg-becker-purple text-white font-semibold py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
              <div className="text-center text-sm">
                {resendTimer > 0 ? (
                  <span className="text-becker-slate">Reenviar em {resendTimer}s</span>
                ) : (
                  <button
                    onClick={requestCode}
                    className="text-becker-purple font-semibold hover:underline"
                  >
                    Reenviar código
                  </button>
                )}
              </div>
              <button
                onClick={() => setStep('phone')}
                className="w-full text-becker-slate text-sm hover:underline"
              >
                ← Trocar WhatsApp
              </button>
            </div>
          )}

          <div className="text-center mt-6 text-xs text-becker-slate">
            Conta criada automaticamente no seu primeiro pedido ✨
          </div>
          <div className="text-center mt-4 text-sm">
            <Link href="/rastrear" className="text-becker-purple font-semibold hover:underline">
              Rastrear um pedido sem login →
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ContaLogada({ session, onLogout }: { session: any; onLogout: () => void }) {
  return (
    <PageShell>
      <ContaLogadaContent session={session} onLogout={onLogout} />
    </PageShell>
  );
}

import { useEffect as useEffect2, useState as useState2 } from 'react';

function ContaLogadaContent({ session, onLogout }: { session: any; onLogout: () => void }) {
  const [orders, setOrders] = useState2<any[]>([]);
  const [loading, setLoading] = useState2(true);

  useEffect2(() => {
    fetch(`/api/conta/pedidos?whatsapp=${encodeURIComponent(session.whatsapp)}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      });
  }, [session]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-becker-purple to-becker-purple-deep rounded-3xl p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 grid place-items-center text-2xl font-bold">
            {session.name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <div className="flex-1">
            <h1 className="display text-2xl font-extrabold">Olá, {session.name?.split(' ')[0]}!</h1>
            <p className="text-white/80 text-sm">{session.whatsapp}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-semibold"
          >
            Sair
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6 max-w-md">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="display text-2xl font-extrabold">{orders.length}</div>
            <div className="text-xs text-white/70">pedidos</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="display text-2xl font-extrabold">🌿</div>
            <div className="text-xs text-white/70">eco warrior</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="display text-2xl font-extrabold">⭐</div>
            <div className="text-xs text-white/70">VIP</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="display text-lg font-extrabold mb-4">Meus pedidos</h2>
          {loading ? (
            <p className="text-sm text-becker-slate">Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-becker-slate">Você ainda não tem pedidos.</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <a
                  key={o.id}
                  href={`/pedido/${o.number}`}
                  className="flex items-center justify-between py-3 border-b border-becker-line last:border-0 hover:bg-becker-cream -mx-2 px-2 rounded"
                >
                  <div>
                    <div className="font-semibold text-sm">{o.number}</div>
                    <div className="text-xs text-becker-slate">
                      {new Date(o.date).toLocaleDateString('pt-BR')} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold">
                      {o.status === 'DELIVERED' ? '✓ Entregue' :
                       o.status === 'SHIPPED' ? '🚚 Enviado' :
                       o.status === 'PROCESSING' ? '📦 Em separação' :
                       o.status === 'PAID' ? '💰 Pago' :
                       o.status === 'PENDING' ? '⏳ Aguardando' :
                       o.status}
                    </span>
                    <span className="font-bold text-sm">R$ {o.total.toFixed(2)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <a href="/carrinho" className="block bg-white rounded-2xl border border-becker-line p-5 hover:shadow-soft transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-becker-purple-soft grid place-items-center text-xl">🛒</div>
              <div className="flex-1">
                <div className="font-semibold">Meu carrinho</div>
                <div className="text-xs text-becker-slate">Continue de onde parou</div>
              </div>
              <span>→</span>
            </div>
          </a>
          <a href="/rastrear" className="block bg-white rounded-2xl border border-becker-line p-5 hover:shadow-soft transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 grid place-items-center text-xl">📦</div>
              <div className="flex-1">
                <div className="font-semibold">Rastrear pedidos</div>
                <div className="text-xs text-becker-slate">Acompanhe em tempo real</div>
              </div>
              <span>→</span>
            </div>
          </a>
          <a href="/atendimento" className="block bg-white rounded-2xl border border-becker-line p-5 hover:shadow-soft transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 grid place-items-center text-xl">💬</div>
              <div className="flex-1">
                <div className="font-semibold">Atendimento</div>
                <div className="text-xs text-becker-slate">Fale com a gente</div>
              </div>
              <span>→</span>
            </div>
          </a>
        </section>
      </div>
    </div>
  );
}
