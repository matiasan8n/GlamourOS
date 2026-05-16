"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        clients(full_name),
        services(name, price),
        staff(full_name)
      `)
      .order("start_time", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setReports(data || []);
  }

  const totalRevenue = useMemo(() => {
    return reports.reduce((sum, item) => {
      return sum + (item.services?.price || 0);
    }, 0);
  }, [reports]);

  const totalAppointments = reports.length;

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((item) => ({
        Cliente: item.clients?.full_name,
        Servicio: item.services?.name,
        Estilista: item.staff?.full_name,
        Estado: item.status,
        Fecha: new Date(item.start_time).toLocaleString(),
        Total: item.services?.price,
      }))
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Reportes"
    );

    XLSX.writeFile(workbook, "glamouros-report.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();

    doc.text("Reporte GlamourOS", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Cliente", "Servicio", "Estilista", "Estado", "Total"]],
      body: reports.map((item) => [
        item.clients?.full_name,
        item.services?.name,
        item.staff?.full_name,
        item.status,
        `RD$${item.services?.price}`,
      ]),
    });

    doc.save("glamouros-report.pdf");
  }

  return (
    <div className="min-h-screen bg-[#FAF7F8] p-10 text-[#18181B]">
      <div className="mb-10">
        <h1 className="text-6xl font-bold text-[#8B2244]">
          Reportes
        </h1>

        <p className="text-[#71717A] mt-2">
          Métricas financieras y operativas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-[#E7DDE1] rounded-3xl p-8 shadow-sm">
          <p className="text-[#71717A] text-lg">
            Ingresos Totales
          </p>

          <h2 className="text-5xl font-bold text-[#8B2244] mt-4">
            RD${totalRevenue}
          </h2>
        </div>

        <div className="bg-white border border-[#E7DDE1] rounded-3xl p-8 shadow-sm">
          <p className="text-[#71717A] text-lg">
            Total de Citas
          </p>

          <h2 className="text-5xl font-bold text-[#8B2244] mt-4">
            {totalAppointments}
          </h2>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={exportExcel}
          className="bg-[#C8456B] hover:bg-[#8B2244] text-white px-6 py-3 rounded-2xl"
        >
          Exportar Excel
        </button>

        <button
          onClick={exportPDF}
          className="bg-[#18181B] hover:bg-black text-white px-6 py-3 rounded-2xl"
        >
          Exportar PDF
        </button>
      </div>

      <div className="bg-white border border-[#E7DDE1] rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[#FBEAF0]">
            <tr>
              <th className="text-left p-5">Cliente</th>
              <th className="text-left p-5">Servicio</th>
              <th className="text-left p-5">Estilista</th>
              <th className="text-left p-5">Estado</th>
              <th className="text-left p-5">Fecha</th>
              <th className="text-left p-5">Total</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((item) => (
              <tr
                key={item.id}
                className="border-t border-[#E7DDE1]"
              >
                <td className="p-5">
                  {item.clients?.full_name}
                </td>

                <td className="p-5">
                  {item.services?.name}
                </td>

                <td className="p-5">
                  {item.staff?.full_name}
                </td>

                <td className="p-5">
                  {item.status}
                </td>

                <td className="p-5">
                  {new Date(
                    item.start_time
                  ).toLocaleString()}
                </td>

                <td className="p-5 font-bold text-[#8B2244]">
                  RD${item.services?.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}