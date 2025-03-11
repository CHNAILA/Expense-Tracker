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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ExpenseChartProps = {
  transactions: Transaction[];
};

const COLORS = ['#8B5CF6', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

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
  const weekEnd = endOfWeek(now);

  const weeklyData = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= weekStart && date <= weekEnd;
    })
    .reduce((acc: any[], transaction) => {
      const day = format(new Date(transaction.date), "EEE");
      const existingDay = acc.find((item) => item.day === day);

      if (existingDay) {
        if (transaction.type === "income") {
          existingDay.income += Number(transaction.amount);
        } else {
          existingDay.expenses += Number(transaction.amount);
        }
      } else {
        acc.push({
          day,
          income: transaction.type === "income" ? Number(transaction.amount) : 0,
          expenses: transaction.type === "expense" ? Number(transaction.amount) : 0,
        });
      }

      return acc;
    }, []);

  // Add empty data for days with no transactions
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const filledWeeklyData = daysOfWeek.map(day => {
    const existingDay = weeklyData.find(d => d.day === day);
    return existingDay || { day, income: 0, expenses: 0 };
  });


  // Calculate category distribution
  const categoryData = transactions
    .filter(t => t.type === "expense")
    .reduce((acc: any[], transaction) => {
      const amount = Number(transaction.amount);
      const existing = acc.find((item) => item.categoryId === transaction.categoryId);

      if (existing) {
        existing.value += amount;
      } else {
        acc.push({
          categoryId: transaction.categoryId,
          value: amount,
        });
      }

      return acc;
    }, []);

  // Sort data chronologically
  monthlyData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Take last 6 months
  const recentMonthlyData = monthlyData.slice(-6);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trend">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Tabs defaultValue={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-[300px]">
            {timeframe === 'monthly' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
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
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filledWeeklyData}> {/* Use filledWeeklyData here */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#8B5CF6" />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="categoryId"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ value }) => `$${value.toFixed(2)}`}
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}