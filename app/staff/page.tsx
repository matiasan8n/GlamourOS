"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [commission, setCommission] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
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
      .from("staff")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    setStaff(data || []);
  }

  async function createStaff() {
    if (!fullName || !phone) {
      alert("Completa nombre y teléfono");
      return;
    }

    const { error } = await supabase.from("staff").insert({
      organization_id: organizationId,
      full_name: fullName,
      phone,
      specialty,
      commission_percentage: Number(commission || 0),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setFullName("");
    setPhone("");
    setSpecialty("");
    setCommission("");

    loadStaff();
  }

  async function deleteStaff(id: string) {
    const confirmed = confirm("¿Eliminar estilista?");

    if (!confirmed) return;

    await supabase.from("staff").delete().eq("id", id);

    loadStaff();
  }

  return (
    <div className="min-h-screen bg-[#FAF7F8] text-[#18181B] p-10">
      <div className="mb-10">
        <h1 className="text-6xl font-bold text-[#8B2244]">
          Estilistas
        </h1>

        <p className="text-[#71717A] mt-2">
          Gestión profesional del equipo de trabajo.
        </p>
      </div>

      <div className="bg-white border border-[#E7DDE1] rounded-3xl p-8 mb-8 shadow-sm">
        <h2 className="text-3xl font-bold text-[#8B2244] mb-8">
          Nueva Estilista
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />

          <input
            type="text"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />

          <input
            type="text"
            placeholder="Especialidad"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />

          <input
            type="number"
            placeholder="% Comisión"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4 outline-none focus:border-[#C8456B]"
          />
        </div>

        <button
          onClick={createStaff}
          className="mt-6 bg-[#C8456B] hover:bg-[#8B2244] text-white px-8 py-4 rounded-2xl font-medium"
        >
          Crear Estilista
        </button>
      </div>

      <div className="space-y-6">
        {staff.map((person) => (
          <div
            key={person.id}
            className="bg-white border border-[#E7DDE1] rounded-3xl p-8 flex justify-between items-center shadow-sm"
          >
            <div>
              <h2 className="text-3xl font-bold text-[#18181B]">
                {person.full_name}
              </h2>

              <p className="text-[#71717A] mt-2">
                {person.phone}
              </p>

              <p className="text-[#C8456B] mt-2">
                {person.specialty} · {person.commission_percentage}% comisión
              </p>
            </div>

            <button
              onClick={() => deleteStaff(person.id)}
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