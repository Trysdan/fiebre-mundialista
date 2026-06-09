const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fetchSupabase(path: string, options?: RequestInit) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res;
}

export async function getRow(key: string) {
  const res = await fetchSupabase(`app_data?key=eq.${key}&select=value`, {
    headers: { Accept: "application/json" },
  });
  const rows = await res.json();
  return rows[0]?.value ?? null;
}

export async function upsertRow(key: string, value: any) {
  await fetchSupabase("app_data", {
    method: "POST",
    body: JSON.stringify({ key, value }),
    headers: { Prefer: "resolution=merge-duplicates" },
  });
}

export async function getAllRows() {
  const res = await fetchSupabase("app_data?select=key,value", {
    headers: { Accept: "application/json" },
  });
  return res.json();
}

export async function getQuinielas() {
  const res = await fetchSupabase("quinielas?select=data", {
    headers: { Accept: "application/json" },
  });
  const rows = await res.json();
  return rows.map((r: any) => r.data);
}

export async function insertQuiniela(body: any) {
  await fetchSupabase("quinielas", {
    method: "POST",
    body: JSON.stringify({
      participante: body.participante,
      archivo_fuente: body.archivo_fuente || "Quiniela",
      data: body,
    }),
    headers: { Prefer: "return=minimal" },
  });
}

export async function recordLoginAttempt(ip: string, username?: string) {
  await fetchSupabase("login_attempts", {
    method: "POST",
    body: JSON.stringify({ ip, username: username || null }),
    headers: { Prefer: "return=minimal" },
  });
}

export async function getRecentLoginAttempts(ip: string, windowMinutes = 15) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const res = await fetchSupabase(
    `login_attempts?ip=eq.${encodeURIComponent(ip)}&attempted_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: { Accept: "application/json" } }
  );
  const rows = await res.json();
  return rows as any[];
}

export async function clearLoginAttempts(ip: string) {
  await fetchSupabase(`login_attempts?ip=eq.${encodeURIComponent(ip)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export async function deleteQuiniela(participante: string) {
  await fetchSupabase(`quinielas?participante=eq.${encodeURIComponent(participante)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
