import { Transaction } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

type ExpenseChartProps = {
  transactions: Transaction[];
};

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  // Group transactions by month and calculate totals
  const monthlyData = transactions.reduce((acc: any[], transaction) => {
    const month = format(new Date(transaction.date), "MMM yyyy");
    const existingMonth = acc.find((item) => item.month === month);

    if (existingMonth) {
      if (transaction.type === "income") {
        existingMonth.income += Number(transaction.amount);
      } else {
        existingMonth.expenses += Number(transaction.amount);
      }
    } else {
      acc.push({
        month,
        income: transaction.type === "income" ? Number(transaction.amount) : 0,
        expenses: transaction.type === "expense" ? Number(transaction.amount) : 0,
      });
    }

    return acc;
  }, []);

  // Sort by date
  monthlyData.sort((a, b) => {
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });

  // Take last 6 months
  const recentData = monthlyData.slice(-6);

  return (
    <div className="w-full h-[300px]">
      {recentData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Income"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
