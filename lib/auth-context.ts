import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/fetch-timeout";

const TIMEOUT_MS = 12_000;

export type AuthContextResult =
  | { ok: true; userId: string; organizationId: string }
  | { ok: false; message: string };

/** Usuario autenticado + organization_id del perfil (requerido para guardar datos). */
export async function getAuthContext(): Promise<AuthContextResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await withTimeout(
      supabase.auth.getUser(),
      TIMEOUT_MS,
      "Tiempo de espera al verificar la sesión. Revisa tu conexión o recarga la página.",
    );

    if (userError) {
      return { ok: false, message: `Sesión: ${userError.message}` };
    }

    if (!user) {
      return { ok: false, message: "No hay sesión activa. Inicia sesión de nuevo." };
    }

    const userId = user.id;

    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle(),
      TIMEOUT_MS,
      "Tiempo de espera al cargar tu perfil. Comprueba la conexión con Supabase.",
    );

    if (profileError) {
      return { ok: false, message: `Perfil: ${profileError.message}` };
    }

    if (!profile) {
      return {
        ok: false,
        message:
          "No tienes fila en profiles. En Supabase ejecuta fix_profiles_and_clients.sql.",
      };
    }

    const organizationId = profile.organization_id;
    if (organizationId == null || organizationId === "") {
      return {
        ok: false,
        message: "Tu perfil no tiene organization_id. Ejecuta fix_profiles_and_clients.sql en Supabase.",
      };
    }

    return { ok: true, userId, organizationId: String(organizationId) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
