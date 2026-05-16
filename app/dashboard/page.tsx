"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);

  const [clientsCount, setClientsCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select(`
        *,
        organizations(*)
      `)
      .eq("id", user.id)
      .single();

    if (!profileData) {
      alert("Perfil no encontrado");
      return;
    }

    setProfile(profileData);

    const organizationId = profileData.organization_id;

    const [
      clientsResult,
      staffResult,
      servicesResult,
      appointmentsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),

      supabase
        .from("staff")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),

      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),

      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

    setClientsCount(clientsResult.count || 0);
    setStaffCount(staffResult.count || 0);
    setServicesCount(servicesResult.count || 0);
    setAppointmentsCount(appointmentsResult.count || 0);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#FAF7F8] p-10 text-[#18181B]">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-6xl font-bold text-[#8B2244]">
            Glamour Studio
          </h1>

          <p className="text-[#71717A] mt-3 text-lg">
            Bienvenido, {profile?.full_name}
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-[#C8456B] hover:bg-[#8B2244] text-white px-6 py-3 rounded-2xl"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Clientas"
          value={clientsCount}
          link="/clients"
        />

        <DashboardCard
          title="Estilistas"
          value={staffCount}
          link="/staff"
        />

        <DashboardCard
          title="Servicios"
          value={servicesCount}
          link="/services"
        />

        <DashboardCard
          title="Citas"
          value={appointmentsCount}
          link="/appointments"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          title="Organización"
          value={profile?.organizations?.name || "N/A"}
        />

        <InfoCard
          title="Plan"
          value={profile?.organizations?.subscription_plan || "N/A"}
        />

        <InfoCard
          title="Estado"
          value={profile?.organizations?.subscription_status || "active"}
        />
      </div>

      <div className="mt-10 bg-white border border-[#E7DDE1] rounded-3xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-[#8B2244] mb-6">
          Accesos rápidos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickButton
            title="Nueva Cita"
            href="/appointments"
          />

          <QuickButton
            title="Nueva Clienta"
            href="/clients"
          />

          <QuickButton
            title="Nuevo Servicio"
            href="/services"
          />

          <QuickButton
            title="Ver Reportes"
            href="/reports"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  link,
}: {
  title: string;
  value: number;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="bg-white border border-[#E7DDE1] rounded-3xl p-8 shadow-sm hover:shadow-md transition-all"
    >
      <p className="text-[#71717A] text-lg">
        {title}
      </p>

      <h2 className="text-5xl font-bold text-[#8B2244] mt-4">
        {value}
      </h2>
    </Link>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-[#E7DDE1] rounded-3xl p-8 shadow-sm">
      <p className="text-[#71717A] text-lg">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-[#18181B] mt-4">
        {value}
      </h2>
    </div>
  );
}

function QuickButton({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[#FBEAF0] hover:bg-[#C8456B] hover:text-white border border-[#E7DDE1] rounded-2xl p-5 text-center transition-all font-medium text-[#8B2244]"
    >
      {title}
    </Link>
  );
}