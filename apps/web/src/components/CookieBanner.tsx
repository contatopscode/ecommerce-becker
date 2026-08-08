'use client';

import { useState, useEffect } from 'react';
import { getConsent, acceptAll, rejectAll, setConsent, loadScriptsForConsent } from '@/lib/consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Mostra banner se não há consentimento
    if (!getConsent()) {
      setShowBanner(true);
    } else {
      loadScriptsForConsent();
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
    setShowConfig(false);
    loadScriptsForConsent();
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowBanner(false);
    setShowConfig(false);
  };

  const handleSaveConfig = () => {
    setConsent({ analytics, marketing });
    setShowBanner(false);
    setShowConfig(false);
    loadScriptsForConsent();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner fixo no rodapé */}
      {!showConfig && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white border-t-2 border-becker-purple shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 text-sm text-becker-ink">
              <span className="font-semibold">🍪 Usamos cookies</span> para melhorar sua experiência. Ao continuar, você concorda com nossa{' '}
              <a href="/privacidade" className="underline text-becker-purple font-semibold">
                Política de Privacidade
              </a>
              .
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 text-sm font-semibold border-2 border-becker-line text-becker-ink rounded-full hover:border-becker-purple transition"
              >
                Configurar
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-semibold bg-becker-purple text-white rounded-full hover:bg-becker-purple-deep transition"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuração */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">Configurar Cookies</h2>
              <button onClick={() => setShowConfig(false)} className="text-becker-slate hover:text-becker-ink text-2xl leading-none">
                ×
              </button>
            </div>

            <p className="text-sm text-becker-slate mb-5">
              Escolha quais tipos de cookies você permite. Você pode mudar a qualquer momento.
            </p>

            <div className="space-y-4">
              {/* Essencial - sempre on */}
              <div className="border-2 border-becker-line rounded-xl p-4 bg-becker-cream/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">🔒 Essencial</div>
                  <span className="text-xs font-bold bg-eco-500 text-white px-2 py-1 rounded-full">
                    SEMPRE ATIVO
                  </span>
                </div>
                <p className="text-xs text-becker-slate">
                  Necessário para login, carrinho e segurança. Não pode ser desativado.
                </p>
              </div>

              {/* Analytics */}
              <div className="border-2 border-becker-line rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">📊 Analytics</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-becker-line peer-checked:bg-becker-purple rounded-full transition relative">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
                <p className="text-xs text-becker-slate">
                  Nos ajuda a entender como você usa o site para melhorarmos a experiência.
                </p>
              </div>

              {/* Marketing */}
              <div className="border-2 border-becker-line rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">🎯 Marketing</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-becker-line peer-checked:bg-becker-purple rounded-full transition relative">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
                <p className="text-xs text-becker-slate">
                  Permite anúncios personalizados (Facebook, Google Ads).
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 font-semibold border-2 border-becker-line text-becker-ink rounded-full hover:border-becker-purple transition"
              >
                Rejeitar tudo
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2.5 font-semibold bg-becker-purple text-white rounded-full hover:bg-becker-purple-deep transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
