'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

interface PaymentClientProps {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
}

/**
 * Tela de pagamento SIMULADO
 * Sprint 6: substituir por integração Mercado Pago real
 * - PIX: mostra QR code fake + permite "simular pagamento"
 * - Cartão: mostra form fake + permite "simular"
 * - Após confirmar, status do pedido vira PAID
 */
export function PaymentClient({ orderId, orderNumber, total, paymentMethod }: PaymentClientProps) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 min em segundos

  // Countdown
  useEffect(() => {
    if (paid) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paid]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Simula pagamento aprovado
  const simulatePayment = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/orders/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, method: paymentMethod }),
      });
      const data = await res.json();
      if (data.ok) {
        setPaid(true);
        toast('🎉 Pagamento confirmado!', 'success');
        setTimeout(() => {
          router.push(`/pedido/${orderId}`);
        }, 2000);
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setPaying(false);
  };

  if (paid) {
    return (
      <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
        <div className="text-7xl mb-4 animate-bounce">✅</div>
        <h2 className="text-2xl font-extrabold text-eco-600 mb-2">Pagamento confirmado!</h2>
        <p className="text-becker-slate mb-4">Pedido {orderNumber}</p>
        <p className="text-sm text-becker-slate">Redirecionando para o tracking do pedido...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-becker-line p-6 mb-4">
        {/* Header com total + countdown */}
        <div className="flex items-center justify-between pb-4 border-b border-becker-line mb-4">
          <div>
            <div className="text-xs text-becker-slate uppercase">Total a pagar</div>
            <div className="text-3xl font-extrabold text-becker-purple">{formatPrice(total)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-becker-slate uppercase">Expira em</div>
            <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-becker-ink'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {paymentMethod === 'pix' ? <PixPayment total={total} orderNumber={orderNumber} />
                                  : <CardPayment total={total} />}

        {/* Botão simular */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-amber-300 bg-amber-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧪</span>
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">Modo teste (Sprint 3)</div>
              <p className="text-xs text-amber-800 mt-0.5">
                Mercado Pago será integrado na Sprint 6. Por enquanto, clique abaixo pra simular aprovação e testar o fluxo completo.
              </p>
              <button
                onClick={simulatePayment}
                disabled={paying}
                className="mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-full text-sm disabled:opacity-50"
              >
                {paying ? 'Processando...' : '✓ Simular pagamento aprovado'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-becker-cream rounded-2xl p-4 text-center text-xs text-becker-slate">
        🔒 Ambiente seguro. Em produção, este pagamento é processado pelo <strong>Mercado Pago</strong>.
      </div>
    </>
  );
}

function PixPayment({ total, orderNumber }: { total: number; orderNumber: string }) {
  // QR code fake (placeholder)
  const fakePixCode = `00020126580014BR.GOV.BCB.PIX0136becker@pscode.ia.br520400005303986540${total.toFixed(2).replace('.', '')}5802BR5913BECKER LTDA6009SAO PAULO62070503***6304ABCD`;

  return (
    <>
      <h3 className="font-extrabold text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">💠</span> Pague com PIX
      </h3>

      {/* QR Code fake */}
      <div className="flex flex-col items-center">
        <div className="w-56 h-56 bg-white border-4 border-becker-purple rounded-2xl p-3 mb-3 relative">
          <QrCodePlaceholder code={fakePixCode} />
        </div>
        <p className="text-xs text-becker-slate text-center mb-3">
          Abra o app do seu banco e escaneie o QR Code
        </p>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(fakePixCode);
            toast('Código PIX copiado!', 'success');
          }}
          className="text-xs text-becker-purple hover:underline mb-2"
        >
          📋 Copiar código PIX
        </button>
      </div>
    </>
  );
}

function CardPayment({ total }: { total: number }) {
  return (
    <>
      <h3 className="font-extrabold text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">💳</span> Cartão de Crédito
      </h3>

      <div className="space-y-3 max-w-md mx-auto">
        <input
          placeholder="Número do cartão (simulado)"
          className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
          disabled
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Validade (simulado)"
            className="border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
            disabled
          />
          <input
            placeholder="CVV (simulado)"
            className="border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
            disabled
          />
        </div>
        <input
          placeholder="Nome no cartão (simulado)"
          className="w-full border-2 border-becker-line rounded-xl px-4 py-3 focus:border-becker-purple outline-none"
          disabled
        />
        <p className="text-xs text-becker-slate text-center mt-3">
          Pagamento processado em até 3x sem juros de <strong>{formatPrice(total / 3)}</strong>
        </p>
      </div>
    </>
  );
}

function QrCodePlaceholder({ code }: { code: string }) {
  // QR code visual fake (grid pattern baseado no hash do code)
  const size = 21;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;

  for (let i = 0; i < size; i++) {
    cells[i] = [];
    for (let j = 0; j < size; j++) {
      // Padrão pseudo-aleatório estável
      const v = (hash ^ (i * 31 + j * 17)) & 0xff;
      cells[i][j] = v % 3 === 0;
    }
  }

  // Cantinhos fixos (estilo QR code real)
  const isFinder = (x: number, y: number) => {
    const inSquare = (cx: number, cy: number) =>
      x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
    return inSquare(0, 0) || inSquare(size - 7, 0) || inSquare(0, size - 7);
  };

  return (
    <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size * size }).map((_, idx) => {
        const i = Math.floor(idx / size);
        const j = idx % size;
        const filled = isFinder(i, j) || cells[i][j];
        return (
          <div
            key={idx}
            className={filled ? 'bg-becker-ink' : 'bg-white'}
            style={{ aspectRatio: '1' }}
          />
        );
      })}
    </div>
  );
}
