import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { KotakStatus } from '@/components/dashboard/KotakStatus';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Current holdings &amp; positions</p>
        </div>
        <KotakStatus />
      </div>
      <HoldingsTable />
    </div>
  );
}
