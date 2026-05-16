import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata = {
  title: "GlamourOS",
  description: "Beauty Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#FAF7F8] text-[#18181B]">
        <div className="flex min-h-screen w-full min-w-0 flex-col md:flex-row">
          <Sidebar />

          <main className="relative z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#FAF7F8] p-4 sm:p-6 md:min-h-screen md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
