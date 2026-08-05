// ============================================================
// Tracking Timeline - visualização do status do pedido
// Sprint 2: linha do tempo com ícones
// ============================================================

interface TimelineProps {
  status: string;
  tracking?: string | null;
}

const STEPS = [
  { id: 'PENDING', icon: '📝', label: 'Pedido recebido' },
  { id: 'PAID', icon: '💰', label: 'Pagamento confirmado' },
  { id: 'PROCESSING', icon: '📦', label: 'Em separação' },
  { id: 'SHIPPED', icon: '🚚', label: 'A caminho' },
  { id: 'DELIVERED', icon: '✅', label: 'Entregue' },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

export function TrackingTimeline({ status, tracking }: TimelineProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div className="text-3xl mb-2">❌</div>
        <div className="font-bold text-red-700">Pedido cancelado</div>
        <div className="text-xs text-red-600 mt-1">Entre em contato se tiver dúvidas</div>
      </div>
    );
  }

  if (status === 'REFUNDED') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <div className="text-3xl mb-2">💰</div>
        <div className="font-bold text-slate-700">Pedido reembolsado</div>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {/* Linha conectora */}
              {idx > 0 && (
                <div className={`absolute top-5 right-1/2 w-full h-1 -z-10 ${
                  isCompleted || isCurrent ? 'bg-eco-500' : 'bg-becker-line'
                }`} />
              )}

              {/* Círculo */}
              <div className={`w-10 h-10 rounded-full grid place-items-center text-lg font-bold border-2 ${
                isCompleted ? 'bg-eco-500 border-eco-500 text-white' :
                isCurrent ? 'bg-becker-purple border-becker-purple text-white animate-pulse' :
                'bg-white border-becker-line text-becker-slate'
              }`}>
                {isCompleted ? '✓' : step.icon}
              </div>

              {/* Label */}
              <div className={`text-[10px] sm:text-xs font-semibold mt-2 text-center ${
                isCurrent ? 'text-becker-purple' :
                isCompleted ? 'text-eco-600' :
                'text-becker-slate'
              }`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {tracking && status === 'SHIPPED' && (
        <div className="mt-6 p-3 bg-becker-purple-soft border border-becker-purple/20 rounded-xl text-sm">
          <div className="text-xs text-becker-slate font-semibold">Código de rastreio</div>
          <div className="font-mono font-bold text-becker-purple">{tracking}</div>
          <a
            href={`https://rastreamento.correios.com.br/app/index.php?objetos=${tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-becker-purple hover:underline mt-1 inline-block"
          >
            Rastrear nos Correios →
          </a>
        </div>
      )}
    </div>
  );
}
