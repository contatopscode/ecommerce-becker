'use client';

import { useState } from 'react';
import type { StoreSettings } from '@/lib/settings';

type Issue = { campo: string; mensagem: string };

const inputCls = 'w-full border border-becker-line rounded-lg px-3 py-2 text-sm bg-white';

export function StoreForm({ initial }: { initial: StoreSettings }) {
  const [form, setForm] = useState<StoreSettings>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setForm((f) => ({ ...f, [k]: v }));
  const errOf = (campo: string) => issues.find((i) => i.campo === campo)?.mensagem;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setIssues([]);
    try {
      const res = await fetch('/api/admin/config/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: { settings?: StoreSettings; error?: string; issues?: Issue[] } = await res.json();
      if (res.ok && data.settings) {
        setForm(data.settings);
        setMsg('Salvo com sucesso.');
      } else {
        setIssues(data.issues ?? []);
        setMsg(data.error ?? 'Erro ao salvar.');
      }
    } catch {
      setMsg('Falha de rede ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/config/upload', { method: 'POST', body: fd });
      const data: { url?: string; error?: string } = await res.json();
      if (res.ok && data.url) set('logoUrl', data.url);
      else setMsg(data.error ?? 'Falha no upload.');
    } catch {
      setMsg('Falha de rede no upload.');
    }
  }

  const field = (label: string, k: keyof StoreSettings, type = 'text') => (
    <label className="block">
      <span className="text-xs font-semibold text-becker-slate">{label}</span>
      <input
        type={type}
        className={inputCls}
        value={String(form[k])}
        onChange={(e) => set(k, (k === 'freteGratisAPartirDe' ? Number(e.target.value) : e.target.value) as StoreSettings[typeof k])}
      />
      {errOf(k) && <span className="text-xs text-red-600">{errOf(k)}</span>}
    </label>
  );

  return (
    <form onSubmit={save} className="bg-white rounded-2xl border border-becker-line p-6 max-w-2xl space-y-4">
      {field('Nome da loja', 'nome')}
      {field('CNPJ', 'cnpj')}
      {field('E-mail', 'email', 'email')}
      {field('Telefone', 'telefone')}
      {field('WhatsApp', 'whatsapp')}
      {field('Endereço', 'endereco')}

      <div>
        <span className="text-xs font-semibold text-becker-slate">Logo (JPEG, PNG ou WebP, até 5 MB)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block text-sm mt-1"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        {form.logoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img src={form.logoUrl} alt="Logo da loja" className="h-12 w-auto border border-becker-line rounded" />
            <code className="text-xs">{form.logoUrl}</code>
          </div>
        )}
        {errOf('logoUrl') && <span className="text-xs text-red-600">{errOf('logoUrl')}</span>}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">{field('Cor primária (#RRGGBB)', 'corPrimaria')}</div>
        <input
          type="color"
          aria-label="Selecionar cor"
          value={/^#[0-9a-fA-F]{6}$/.test(form.corPrimaria) ? form.corPrimaria : '#000000'}
          onChange={(e) => set('corPrimaria', e.target.value)}
          className="h-10 w-12"
        />
      </div>
      {field('Frete grátis a partir de (R$)', 'freteGratisAPartirDe', 'number')}
      {field('Texto legal curto', 'textoLegalCurto')}
      {field('Texto de privacidade curto', 'textoPrivacidade')}

      <div className="flex items-center gap-3">
        <button disabled={busy} className="bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full disabled:opacity-60">
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </form>
  );
}
