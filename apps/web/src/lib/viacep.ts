// ============================================================
// ViaCEP - consulta automática de CEP
// ============================================================

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function fetchAddressByCep(cep: string): Promise<AddressData | null> {
  const cleaned = (cep || '').replace(/\D/g, '');
  if (cleaned.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, {
      // Cache por 1 dia (CEP não muda)
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.erro) return null;

    return {
      cep: cleaned,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
}
