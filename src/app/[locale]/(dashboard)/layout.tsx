import Sidebar from '@/components/layout/Sidebar';
import SidebarProvider from '@/components/layout/SidebarProvider';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
