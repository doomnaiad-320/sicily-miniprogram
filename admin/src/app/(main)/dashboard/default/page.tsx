import { CategoryBarChart } from "./_components/category-bar-chart";
import { StatsCards } from "./_components/stats-cards";
import { StatusPieChart } from "./_components/status-pie-chart";
import { TrendAreaChart } from "./_components/trend-area-chart";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <StatsCards />
      <StatusPieChart />
      <div className="grid @3xl/main:grid-cols-2 grid-cols-1 gap-4">
        <TrendAreaChart />
        <CategoryBarChart />
      </div>
    </div>
  );
}
