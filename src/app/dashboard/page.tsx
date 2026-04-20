import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { KotakStatus } from '@/components/dashboard/KotakStatus';
import { SummaryCards } from '@/components/dashboard/SummaryCards';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Holdings &amp; overview</p>
        </div>
        <KotakStatus />
      </div>
      <SummaryCards />
      <HoldingsTable />
    </div>
  );
}
