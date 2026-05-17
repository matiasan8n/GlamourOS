"use client";

import { useEffect, useState } from "react";
import Modal from "react-modal";
import { supabase } from "@/lib/supabase";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop(Calendar);

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    "en-US": enUS,
  },
});

export default function AppointmentsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [organizationId, setOrganizationId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [clientId, setClientId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

    const { data: branch } = await supabase
      .from("branches")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_main", true)
      .single();

    if (branch) {
      setBranchId(branch.id);
    }

    const [clientsResult, staffResult, servicesResult, appointmentsResult] =
      await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("organization_id", profile.organization_id),

        supabase
          .from("staff")
          .select("*")
          .eq("organization_id", profile.organization_id),

        supabase
          .from("services")
          .select("*")
          .eq("organization_id", profile.organization_id),

        supabase
          .from("appointments")
          .select(`
            *,
            clients(full_name, phone),
            services(name, price, duration_minutes),
            staff(full_name, specialty)
          `)
          .eq("organization_id", profile.organization_id),
      ]);

    setClients(clientsResult.data || []);
    setStaff(staffResult.data || []);
    setServices(servicesResult.data || []);

    const formatted =
      appointmentsResult.data?.map((item: any) => ({
        id: item.id,
        title: `${item.clients?.full_name || "Clienta"} - ${
          item.services?.name || "Servicio"
        }`,
        start: new Date(item.start_time),
        end: new Date(item.end_time),
        allDay: false,

        client_name: item.clients?.full_name,
        service_name: item.services?.name,
        staff_name: item.staff?.full_name,

        resource: item,
      })) || [];

    setEvents(formatted);
  }

  async function createAppointment() {
    if (!clientId || !staffId || !serviceId || !selectedDate) {
      alert("Completa todos los campos");
      return;
    }

    const selectedService = services.find((s) => s.id === serviceId);
    const duration = Number(selectedService?.duration_minutes);

    if (!duration || duration <= 0) {
      alert("Este servicio no tiene duración configurada.");
      return;
    }

    const endDate = new Date(selectedDate.getTime() + duration * 60000);

    const { error } = await supabase.from("appointments").insert({
      organization_id: organizationId,
      branch_id: branchId || null,
      client_id: clientId,
      staff_id: staffId,
      service_id: serviceId,
      start_time: selectedDate.toISOString(),
      end_time: endDate.toISOString(),
      status: "scheduled",
      notes,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCreateOpen(false);
    setClientId("");
    setStaffId("");
    setServiceId("");
    setNotes("");

    await loadData();
  }

  async function rescheduleAppointment({ event, start }: any) {
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);

    const duration = originalEnd.getTime() - originalStart.getTime();

    const newEnd = new Date(start.getTime() + duration);

    const { error } = await supabase
      .from("appointments")
      .update({
        start_time: start.toISOString(),
        end_time: newEnd.toISOString(),
      })
      .eq("id", event.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  async function updateStatus(status: string) {
    if (!selectedAppointment) return;

    const { error } = await supabase
      .from("appointments")
      .update({
        status,
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      alert(error.message);
      return;
    }

    setDetailOpen(false);
    setSelectedAppointment(null);

    await loadData();
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-[#FAF7F8] px-4 py-6 text-[#18181B]">
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-[#8B2244]">Agenda</h1>

        <p className="text-[#6E4B57] mt-2 text-lg">
          Arrastra una cita para reagendarla. Haz clic para ver detalles.
        </p>
      </div>

      <div className="bg-white border border-[#E7DDE1] rounded-3xl p-4 shadow-sm h-[680px] overflow-hidden">
      <DnDCalendar
  localizer={localizer}
  events={events}
  selectable
  resizable
  popup
  toolbar={true}
  defaultView="week"
  views={{
    month: true,
    week: true,
    day: true,
    agenda: true,
  }}
  defaultView="month"
  }}
  length={7}
  step={30}
  timeslots={2}
  min={new Date(2026, 0, 1, 8, 0)}
  max={new Date(2026, 0, 1, 20, 0)}
  showMultiDayTimes
  draggableAccessor={() => true}
  startAccessor={(event: any) => new Date(event.start)}
  endAccessor={(event: any) => new Date(event.end)}
  style={{
    height: "100%",
    minHeight: "650px",
  }}
  onSelectSlot={(slotInfo: any) => {
    setSelectedDate(slotInfo.start)
    setCreateOpen(true)
  }}
  onSelectEvent={(event: any) => {
    setSelectedAppointment(event.resource || event)
    setDetailOpen(true)
  }}
  onEventDrop={async ({ event, start, end }: any) => {
    try {
      await supabase
        .from("appointments")
        .update({
          start_time: start,
          end_time: end,
        })
        .eq("id", event.id)

      loadData()
    } catch (error) {
      console.error(error)
    }
  }}
  onEventResize={async ({ event, start, end }: any) => {
    try {
      await supabase
        .from("appointments")
        .update({
          start_time: start,
          end_time: end,
        })
        .eq("id", event.id)

      loadData()
    } catch (error) {
      console.error(error)
    }
  }}
  eventPropGetter={(event: any) => {
    const status = String(
      event.resource?.status || "scheduled"
    )

    let backgroundColor = "#EC4899"

    if (status === "completed") {
      backgroundColor = "#10B981"
    }

    if (status === "cancelled") {
      backgroundColor = "#EF4444"
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "12px",
        border: "none",
        color: "white",
        padding: "4px",
        fontSize: "13px",
      },
    }
  }}
/>
          onEventDrop={rescheduleAppointment}
          onEventResize={rescheduleAppointment}
          onSelectSlot={(slot: any) => {
            setSelectedDate(slot.start);
            setCreateOpen(true);
          }}
          onSelectEvent={(event: any) => {
            setSelectedAppointment(event.resource);
            setDetailOpen(true);
          }}
        />
      </div>

      <Modal
        isOpen={createOpen}
        onRequestClose={() => setCreateOpen(false)}
        className="bg-white p-10 rounded-3xl w-[600px] mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex items-start justify-center z-50"
        ariaHideApp={false}
      >
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-[#8B2244]">Nueva Cita</h2>

          <p className="text-[#71717A]">
            {selectedDate?.toLocaleString()}
          </p>

          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4"
          >
            <option value="">Seleccionar clienta</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>

          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="w-full bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4"
          >
            <option value="">Seleccionar estilista</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>

          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4"
          >
            <option value="">Seleccionar servicio</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - RD${service.price}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-4"
          />

          <div className="flex gap-4">
            <button
              onClick={createAppointment}
              className="bg-[#C8456B] hover:bg-[#8B2244] text-white px-8 py-4 rounded-2xl"
            >
              Guardar Cita
            </button>

            <button
              onClick={() => setCreateOpen(false)}
              className="bg-[#E7DDE1] hover:bg-[#d8cdd1] px-8 py-4 rounded-2xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onRequestClose={() => setDetailOpen(false)}
       className="bg-white p-8 rounded-3xl w-[560px] max-h-[85vh] overflow-y-auto mx-auto mt-10 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex items-start justify-center z-50"
        ariaHideApp={false}
      >
        {selectedAppointment && (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#8B2244]">
              Detalle de Cita
            </h2>

            <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
              <p className="text-sm text-[#71717A]">Clienta</p>
              <h3 className="text-2xl font-bold">
                {selectedAppointment.clients?.full_name}
              </h3>
              <p className="text-[#71717A]">
                {selectedAppointment.clients?.phone || "Sin teléfono"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
                <p className="text-sm text-[#71717A]">Servicio</p>
                <h3 className="text-xl font-bold">
                  {selectedAppointment.services?.name}
                </h3>
                <p className="text-[#8B2244] font-bold">
                  RD${selectedAppointment.services?.price || 0}
                </p>
              </div>

              <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
                <p className="text-sm text-[#71717A]">Estilista</p>
                <h3 className="text-xl font-bold">
                  {selectedAppointment.staff?.full_name}
                </h3>
                <p className="text-[#71717A]">
                  {selectedAppointment.staff?.specialty || "Sin especialidad"}
                </p>
              </div>
            </div>

            <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
              <p className="text-sm text-[#71717A]">Horario</p>
              <p className="font-semibold">
                {new Date(selectedAppointment.start_time).toLocaleString()} -{" "}
                {new Date(selectedAppointment.end_time).toLocaleTimeString()}
              </p>
            </div>

            <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
              <p className="text-sm text-[#71717A]">Estado</p>
              <p className="font-bold text-[#8B2244]">
                {selectedAppointment.status}
              </p>
            </div>

            {selectedAppointment.notes && (
              <div className="bg-[#FAF7F8] border border-[#E7DDE1] rounded-2xl p-5">
                <p className="text-sm text-[#71717A]">Notas</p>
                <p>{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => updateStatus("completed")}
                className="bg-[#1D9E75] text-white px-5 py-3 rounded-2xl"
              >
                Completar
              </button>

              <button
                onClick={() => updateStatus("cancelled")}
                className="bg-[#D85A30] text-white px-5 py-3 rounded-2xl"
              >
                Cancelar cita
              </button>

              <button
                onClick={() => setDetailOpen(false)}
                className="bg-[#E7DDE1] px-5 py-3 rounded-2xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}