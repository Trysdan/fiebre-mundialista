import { getRow } from "./supabase";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function getContactInfo() {
  const contacto = await getRow("contacto");
  return contacto as { email: string; telefonos: string[] } | null;
}

export async function sendLoginAlert(ip: string, username?: string) {
  const contact = await getContactInfo();
  const email = contact?.email || "fiebremundialista206@gmail.com";
  const time = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });

  await sendEmail({
    to: email,
    subject: "⚠️ Alerta de Seguridad - Fiebre Mundialista",
    html: `
      <h2>Intento de acceso no autorizado</h2>
      <p>Se detectaron múltiples intentos de inicio de sesión fallidos.</p>
      <ul>
        <li><strong>IP:</strong> ${ip}</li>
        <li><strong>Usuario:</strong> ${username || "desconocido"}</li>
        <li><strong>Fecha/Hora:</strong> ${time}</li>
      </ul>
      <p>El acceso ha sido bloqueado temporalmente para esta IP.</p>
    `,
  });

  for (const phone of contact?.telefonos || []) {
    try {
      await sendWhatsApp(phone, `⚠️ Alerta Fiebre Mundialista\n${username || "Alguien"} intentó acceder al panel admin desde ${ip}\nBloqueado por 15 min.`);
    } catch {
      console.warn(`Failed to send WhatsApp to ${phone}`);
    }
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — skipping email notification. Configure it in Vercel env vars.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Fiebre Mundialista <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
}

async function sendWhatsApp(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn("Twilio not configured — skipping WhatsApp notification. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in Vercel env vars.");
    return;
  }

  const formatted = to.startsWith("+") ? `whatsapp:${to}` : `whatsapp:+58${to}`;
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: formatted,
        Body: message,
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error: ${res.status} ${text}`);
  }
}
