import { NextResponse } from "next/server";
import { getRow, recordLoginAttempt, getRecentLoginAttempts, clearLoginAttempts } from "@/lib/supabase";

const MAX_ATTEMPTS = 3;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    const ip = getClientIp(request);

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const attempts = await getRecentLoginAttempts(ip, WINDOW_MINUTES);
    if (attempts.length >= MAX_ATTEMPTS) {
      const oldest = attempts[0];
      const retryAfter = BLOCK_MINUTES * 60;
      return NextResponse.json({
        error: "blocked",
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${BLOCK_MINUTES} minutos.`,
        retryAfter,
      }, { status: 429 });
    }

    const creds = await getRow("admin_creds");
    const validUser = creds?.usuario || "admin";
    const validPass = creds?.password || "admin";

    if (username !== validUser || password !== validPass) {
      await recordLoginAttempt(ip, username);
      const remaining = MAX_ATTEMPTS - attempts.length - 1;
      if (remaining === 0) {
        const { sendLoginAlert } = await import("@/lib/notifications");
        try {
          await sendLoginAlert(ip, username);
        } catch (e) {
          console.error("Failed to send login alert:", e);
        }
      }
      return NextResponse.json({
        error: "invalid",
        message: `Credenciales incorrectas. ${remaining > 0 ? `Te quedan ${remaining} intento${remaining > 1 ? "s" : ""}.` : "Cuenta bloqueada temporalmente."}`,
        remaining,
      }, { status: 401 });
    }

    await clearLoginAttempts(ip);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
