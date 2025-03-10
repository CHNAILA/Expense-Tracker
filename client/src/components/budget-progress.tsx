import { Transaction, Budget, Category } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type BudgetProgressProps = {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
};

export default function BudgetProgress({
  budgets,
  transactions,
  categories,
}: BudgetProgressProps) {
  const { toast } = useToast();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter current month's budgets
  const currentBudgets = budgets.filter(
    (budget) => budget.month === currentMonth && budget.year === currentYear
  );

  // Calculate spending for each category
  const categorySpending = transactions.reduce((acc: { [key: number]: number }, transaction) => {
    if (
      transaction.type === "expense" &&
      new Date(transaction.date).getMonth() + 1 === currentMonth &&
      new Date(transaction.date).getFullYear() === currentYear
    ) {
      acc[transaction.categoryId] = (acc[transaction.categoryId] || 0) + Number(transaction.amount);
    }
    return acc;
  }, {});

  // Check for budget alerts
  useEffect(() => {
    currentBudgets.forEach((budget) => {
      const spent = categorySpending[budget.categoryId] || 0;
      const budgetAmount = Number(budget.amount);
      const category = categories.find((c) => c.id === budget.categoryId);

      if (spent >= budgetAmount * 0.9 && spent < budgetAmount) {
        toast({
          title: "Budget Alert",
          description: `You've used 90% of your ${category?.name} budget`,
          variant: "warning",
        });
      } else if (spent >= budgetAmount) {
        toast({
          title: "Budget Exceeded",
          description: `You've exceeded your ${category?.name} budget`,
          variant: "destructive",
        });
      }
    });
  }, [budgets, categorySpending, categories, toast]);

  return (
    <div className="space-y-4">
      {currentBudgets.map((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        const spent = categorySpending[budget.categoryId] || 0;
        const progress = Math.min((spent / Number(budget.amount)) * 100, 100);
        const isOverBudget = spent > Number(budget.amount);

        return (
          <Card key={budget.id} className={isOverBudget ? "border-red-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category?.name}</span>
                  {isOverBudget && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className={isOverBudget ? "text-red-500 font-semibold" : ""}>
                  ${spent.toFixed(2)} / ${Number(budget.amount).toFixed(2)}
                </span>
              </div>
              <Progress
                value={progress}
                className={isOverBudget ? "bg-red-200" : ""}
                indicatorClassName={isOverBudget ? "bg-red-500" : "bg-purple-500"}
              />
              {isOverBudget && (
                <p className="text-sm text-red-500 mt-2">
                  Budget exceeded by ${(spent - Number(budget.amount)).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
      {currentBudgets.length === 0 && (
        <div className="text-center text-muted-foreground">
          No budgets set for this month
        </div>
      )}
    </div>
  );
}