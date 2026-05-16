"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    setOrganizationId(profile.organization_id);

    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    setServices(data || []);
  }

  async function createService() {
    if (!name || !price) {
      alert("Completa nombre y precio");
      return;
    }

    const { error } = await supabase.from("services").insert({
      organization_id: organizationId,
      name,
      price: Number(price),
      duration_minutes: Number(duration || 60),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPrice("");
    setDuration("");

    loadServices();
  }

  async function deleteService(id: string) {
    const confirmed = confirm("¿Eliminar servicio?");

    if (!confirmed) return;

    await supabase.from("services").delete().eq("id", id);

    loadServices();
  }

  return (
    <div className="min-h-screen bg-[#FAF7F8] text-[#18181B] p-10">
      <div className="mb-10">
        <h1 className="text-6xl font-bold text-[#8B2244]">
          Servicios
        </h1>

        <p className="text-[#71717A] mt-2">
          Gestión de servicios y precios.
        </p>
      </div>

      <div className="bg-white border border-[#E7DDE1] rounded-3xl p-8 mb-8 shadow-sm">
        <h2 className="text-3xl font-bold text-[#8B2244] mb-8">
          Nuevo Servicio
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />

          <input
            type="number"
            placeholder="Precio"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />

          <input
            type="number"
            placeholder="Duración (min)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />
        </div>

        <button
          onClick={createService}
          className="mt-6 bg-[#C8456B] hover:bg-[#8B2244] text-white px-8 py-4 rounded-2xl font-medium"
        >
          Crear Servicio
        </button>
      </div>

      <div className="space-y-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-[#E7DDE1] rounded-3xl p-8 flex justify-between items-center shadow-sm"
          >
            <div>
              <h2 className="text-3xl font-bold text-[#18181B]">
                {service.name}
              </h2>

              <p className="text-[#71717A] mt-2">
                RD${service.price}
              </p>

              <p className="text-[#C8456B] mt-2">
                {service.duration_minutes} minutos
              </p>
            </div>

            <button
              onClick={() => deleteService(service.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}