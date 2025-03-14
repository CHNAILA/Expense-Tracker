import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import TransactionList from "@/components/transaction-list";
import TransactionForm from "@/components/transaction-form";
import ExpenseChart from "@/components/expense-chart";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, LogOut } from "lucide-react";
import { Transaction, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showBottomNav, setShowBottomNav] = useState(false);

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const totalIncome = transactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalExpenses = transactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  // Monitor expenses and show alert when they exceed income
  useEffect(() => {
    if (totalExpenses > totalIncome && totalIncome > 0) {
      toast({
        title: "Expense Alert",
        description: "Your expenses have exceeded your total income!",
        variant: "destructive",
      });
    }
  }, [totalExpenses, totalIncome, toast]);

  // Handle scroll for bottom navbar
  useEffect(() => {
    const handleScroll = () => {
      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight;
      setShowBottomNav(bottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1321]">
      <header className="border-b border-[#C5832B]/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#C5832B]">ExpenseTracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-[#C5832B]/80">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-20">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-[#0D1321] border-[#C5832B]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#C5832B]">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1321] border-[#C5832B]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#C5832B]">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                PKR {totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1321] border-[#C5832B]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#C5832B]">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C5832B]">
                PKR {(totalIncome - totalExpenses).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-[#0D1321] border-[#C5832B]/20">
          <CardHeader>
            <CardTitle className="text-[#C5832B]">Expense Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseChart transactions={transactions || []} />
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#C5832B]">Recent Transactions</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-[#C5832B] hover:bg-[#C5832B]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </SheetTrigger>
            <SheetContent>
              <TransactionForm categories={categories || []} />
            </SheetContent>
          </Sheet>
        </div>

        <TransactionList
          transactions={transactions || []}
          categories={categories || []}
        />
      </main>

      {/* Bottom navbar with message - only shows when scrolled to bottom */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#C5832B] text-white py-4 text-center">
          Track your spending, achieve your goals!
        </div>
      )}
    </div>
  );
}