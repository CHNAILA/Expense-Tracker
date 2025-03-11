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
  LineChart,
  Line,
} from "recharts";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ExpenseChartProps = {
  transactions: Transaction[];
};

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');

  // Group transactions by month and calculate totals
  const monthlyData = transactions.reduce((acc: any[], transaction) => {
    const month = format(new Date(transaction.date), "MMM yyyy");
    const existingMonth = acc.find((item) => item.month === month);

    if (existingMonth) {
      if (transaction.type === "income") {
        existingMonth.income += Number(transaction.amount);
      } else {
        existingMonth.expenses += Number(transaction.amount);
        existingMonth.savings = existingMonth.income - existingMonth.expenses;
      }
    } else {
      const income = transaction.type === "income" ? Number(transaction.amount) : 0;
      const expenses = transaction.type === "expense" ? Number(transaction.amount) : 0;
      acc.push({
        month,
        income,
        expenses,
        savings: income - expenses,
      });
    }

    return acc;
  }, []);

  // Get weekly data
  const now = new Date();
  const weekStart = startOfWeek(now);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => ({
    date: addDays(weekStart, i),
    day: format(addDays(weekStart, i), "EEE")
  }));

  const weeklyData = daysOfWeek.map(({ date, day }) => {
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return format(transactionDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });

    return {
      day,
      income: dayTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0),
      expenses: dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    };
  });

  // Sort data chronologically
  monthlyData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Take last 6 months
  const recentMonthlyData = monthlyData.slice(-6);

  return (
    <div className="space-y-6">
      <Tabs defaultValue={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value: number) => `PKR ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#8B5CF6" />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `PKR ${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Savings"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}