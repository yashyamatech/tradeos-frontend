import { redirect } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getAuthToken();
  if (!token) redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
