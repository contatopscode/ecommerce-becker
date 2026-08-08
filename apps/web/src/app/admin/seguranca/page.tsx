'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/cart';

export default function SegurancaPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<'idle' | 'setup' | 'confirm' | 'disable'>('idle');
  const [secret, setSecret] = useState('');
  const [otpauth, setOtpauth] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/auth/2fa/status');
      const data = await res.json();
      setEnabled(data.enabled || false);
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  async function startSetup() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) {
        toast(data.error || 'Erro', 'error');
        return;
      }
      setSecret(data.secret);
      setOtpauth(data.otpauth);
      setBackupCodes(data.backupCodes);

      // Gera QR code no client
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(data.otpauth, { width: 256, margin: 2 });
      setQrDataUrl(url);

      setStep('setup');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }

  async function confirmSetup() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, confirmSetup: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast(data.error || 'Código incorreto', 'error');
        return;
      }
      toast('2FA ativado com sucesso!', 'success');
      setEnabled(true);
      setStep('idle');
      setToken('');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }

  async function disable() {
    if (!token) {
      toast('Digite seu código', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast(data.error || 'Código incorreto', 'error');
        return;
      }
      toast('2FA desativado', 'success');
      setEnabled(false);
      setStep('idle');
      setToken('');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }

  function copyBackupCodes() {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast('Códigos copiados!', 'success');
  }

  if (loading && step === 'idle') {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">🔒 Segurança</h1>
      <p className="text-becker-slate mb-6">Gerencie a autenticação de dois fatores da sua conta.</p>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-becker-line p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold mb-1">Autenticação de 2 Fatores (2FA)</div>
            <div className="text-sm text-becker-slate">
              {enabled
                ? '✅ Ativada — sua conta está protegida'
                : '⚠️ Desativada — ative para mais segurança'}
            </div>
          </div>
          <div>
            {enabled ? (
              <button
                onClick={() => setStep('disable')}
                className="px-4 py-2 text-sm font-semibold border-2 border-red-300 text-red-600 rounded-full hover:bg-red-50"
              >
                Desativar
              </button>
            ) : (
              <button
                onClick={startSetup}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold bg-becker-purple text-white rounded-full hover:bg-becker-purple-deep"
              >
                Ativar 2FA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setup Step */}
      {step === 'setup' && (
        <div className="bg-white rounded-2xl border border-becker-line p-6 mb-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold mb-1">1. Escaneie o QR Code</h2>
            <p className="text-sm text-becker-slate mb-3">
              Abra o Google Authenticator ou Authy no celular e escaneie o código abaixo.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center bg-becker-cream/30 rounded-xl p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code 2FA" className="w-48 h-48" />
              </div>
            )}
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-becker-slate">Não consegue escanear? Digite o código manual</summary>
              <code className="block mt-2 p-2 bg-becker-cream/30 rounded font-mono break-all">{secret}</code>
            </details>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-1">2. Códigos de Backup</h2>
            <p className="text-sm text-becker-slate mb-2">
              Salve esses códigos em local seguro. Cada um pode ser usado uma vez se você perder o celular.
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-becker-cream/30 rounded-xl font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="text-center py-1">{code}</div>
              ))}
            </div>
            <button
              onClick={copyBackupCodes}
              className="mt-2 text-xs text-becker-purple font-semibold hover:underline"
            >
              📋 Copiar códigos
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-1">3. Confirme o código</h2>
            <p className="text-sm text-becker-slate mb-2">
              Digite o código de 6 dígitos que aparece no app:
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest font-mono border-2 border-becker-line rounded-xl px-3 py-3 focus:border-becker-purple outline-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setStep('idle'); setToken(''); }}
                className="flex-1 px-4 py-2.5 font-semibold border-2 border-becker-line text-becker-ink rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSetup}
                disabled={token.length !== 6 || loading}
                className="flex-1 px-4 py-2.5 font-semibold bg-becker-purple text-white rounded-full disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Step */}
      {step === 'disable' && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 mb-6 space-y-4">
          <div className="text-red-600 font-bold">⚠️ Desativar 2FA</div>
          <p className="text-sm text-becker-slate">
            Para confirmar, digite o código de 6 dígitos do seu app authenticator:
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest font-mono border-2 border-becker-line rounded-xl px-3 py-3 focus:border-red-500 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setStep('idle'); setToken(''); }}
              className="flex-1 px-4 py-2.5 font-semibold border-2 border-becker-line text-becker-ink rounded-full"
            >
              Cancelar
            </button>
            <button
              onClick={disable}
              disabled={token.length !== 6 || loading}
              className="flex-1 px-4 py-2.5 font-semibold bg-red-600 text-white rounded-full disabled:opacity-50"
            >
              Confirmar desativação
            </button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-becker-cream/30 rounded-2xl p-4 text-sm text-becker-slate">
        <div className="font-semibold text-becker-ink mb-1">💡 Como funciona o 2FA?</div>
        <p>
          Após ativar, ao fazer login você precisará digitar um código de 6 dígitos do seu app authenticator
          (além do código do WhatsApp). O código muda a cada 30 segundos.
        </p>
      </div>
    </div>
  );
}
