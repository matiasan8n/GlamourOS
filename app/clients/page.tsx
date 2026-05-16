"use client";

import { useEffect, useRef, useState } from "react";
import { getAuthContext } from "@/lib/auth-context";
import { withTimeout } from "@/lib/fetch-timeout";
import { supabase } from "@/lib/supabase";

const QUERY_TIMEOUT_MS = 12_000;

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadList();
  }, []);

  async function loadList() {
    setListLoading(true);
    setProfileError(null);

    try {
      const ctx = await getAuthContext();

      if (!ctx.ok) {
        if (ctx.message.toLowerCase().includes("sesión")) {
          window.location.href = "/login";
          return;
        }
        setProfileError(ctx.message);
        setOrganizationId(null);
        setClients([]);
        return;
      }

      setOrganizationId(ctx.organizationId);
      setProfileError(null);

      const { data, error } = await withTimeout(
        supabase
          .from("clients")
          .select("*")
          .eq("organization_id", ctx.organizationId)
          .order("created_at", { ascending: false }),
        QUERY_TIMEOUT_MS,
        "La lista de clientas tardó demasiado. Puedes crear una clienta igualmente.",
      );

      if (error) {
        console.error("[clients] list", error);
        setFeedback({
          type: "err",
          text: `Lista: ${error.message}. Si acabas de aplicar RLS, vuelve a ejecutar las políticas en Supabase.`,
        });
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (e) {
      console.error("[clients] loadList", e);
      const msg = e instanceof Error ? e.message : String(e);
      setFeedback({ type: "err", text: msg });
      setClients([]);
    } finally {
      setListLoading(false);
    }
  }

  async function createClient() {
    setFeedback(null);

    if (!fullName.trim() || !phone.trim()) {
      setFeedback({ type: "err", text: "Completa nombre y teléfono." });
      return;
    }

    setSaving(true);

    try {
      const ctx = await getAuthContext();
      if (!ctx.ok) {
        setProfileError(ctx.message);
        setFeedback({ type: "err", text: ctx.message });
        return;
      }

      setOrganizationId(ctx.organizationId);

      const { data, error } = await withTimeout(
        supabase
          .from("clients")
          .insert({
            organization_id: ctx.organizationId,
            full_name: fullName.trim(),
            phone: phone.trim(),
          })
          .select("id, full_name, phone, organization_id")
          .single(),
        QUERY_TIMEOUT_MS,
        "Guardar tardó demasiado. Revisa la conexión o las políticas RLS de la tabla clients.",
      );

      if (error) {
        console.error("[clients] insert", error);
        setFeedback({
          type: "err",
          text: `No se guardó: ${error.message}`,
        });
        return;
      }

      if (!data) {
        setFeedback({
          type: "err",
          text: "Insertó pero no devolvió datos (revisa política SELECT en clients tras INSERT).",
        });
        return;
      }

      setFullName("");
      setPhone("");
      setProfileError(null);
      setFeedback({ type: "ok", text: `Cliente "${data.full_name}" guardada correctamente.` });

      setClients((prev) => [data, ...prev.filter((c) => c.id !== data.id)]);
      void loadList();

      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error("[clients] createClient", e);
      setFeedback({
        type: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(id: string) {
    const confirmed = confirm("¿Eliminar clienta?");
    if (!confirmed) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    setFeedback({ type: "ok", text: "Cliente eliminada." });
  }

  const displayName = (c: any) => c?.full_name ?? c?.fullName ?? c?.name ?? "Sin nombre";
  const displayPhone = (c: any) => c?.phone ?? c?.telefono ?? "—";

  return (
    <div className="min-h-screen bg-[#FAF7F8] p-4 text-[#18181B] sm:p-6 md:p-10">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl font-bold text-[#8B2244] sm:text-5xl md:text-6xl">Clientas</h1>
        <p className="mt-2 text-[#71717A]">Gestión de clientes y contactos.</p>
      </div>

      {profileError ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Cuenta sin configurar</p>
          <p className="mt-1">{profileError}</p>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`mb-6 rounded-2xl border p-4 text-sm ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-950"
          }`}
          role="status"
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="relative mb-8 rounded-3xl border border-[#E7DDE1] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-2xl font-bold text-[#8B2244] sm:text-3xl">Nueva Clienta</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-2xl border border-[#E7DDE1] bg-[#FAF7F8] p-4 outline-none focus:border-[#C8456B]"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-2xl border border-[#E7DDE1] bg-[#FAF7F8] p-4 outline-none focus:border-[#C8456B]"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void createClient()}
          className="mt-6 rounded-2xl bg-[#C8456B] px-8 py-4 font-medium text-white hover:bg-[#8B2244] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Crear Clienta"}
        </button>

        {organizationId ? (
          <p className="mt-3 text-xs text-[#71717A]">Salón vinculado (listo para guardar).</p>
        ) : (
          <p className="mt-3 text-xs text-[#71717A]">
            Si el botón no guarda, espera unos segundos o recarga tras iniciar sesión.
          </p>
        )}
      </div>

      <div ref={listRef}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-[#8B2244] sm:text-2xl">Tus clientas</h2>
          <button
            type="button"
            onClick={() => void loadList()}
            disabled={listLoading}
            className="text-sm text-[#C8456B] underline disabled:opacity-50"
          >
            {listLoading ? "Cargando…" : "Actualizar lista"}
          </button>
        </div>

        {listLoading ? (
          <p className="rounded-2xl border border-[#E7DDE1] bg-white p-6 text-[#71717A]">Cargando lista…</p>
        ) : null}

        {!listLoading && clients.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E7DDE1] bg-white/80 p-6 text-[#71717A]">
            Aún no hay clientas registradas.
          </p>
        ) : null}

        <div className="space-y-4 sm:space-y-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-4 rounded-3xl border border-[#E7DDE1] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8"
            >
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#18181B]">{displayName(client)}</h3>
                <p className="mt-2 text-[#71717A]">{displayPhone(client)}</p>
              </div>
              <button
                type="button"
                onClick={() => void deleteClient(client.id)}
                className="shrink-0 rounded-2xl bg-red-500 px-6 py-3 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
