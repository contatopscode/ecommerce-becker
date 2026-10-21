// Validação do segredo de sessão na inicialização (Next 15 instrumentation).
// Registra erro claro em produção se faltar ou for fraco. Nunca imprime o valor.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;
  const { secretWeakness } = await import('@/lib/auth/signed-cookie');
  const weak = secretWeakness(process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET);
  if (weak) {
    console.error(
      `[seguranca] SESSION_SECRET inválido: ${weak}. Login e sessões vão falhar até configurar um segredo de 32+ caracteres.`,
    );
  }
}
