import { Transaction, Budget, Category } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div className="space-y-4">
      {currentBudgets.map((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        const spent = categorySpending[budget.categoryId] || 0;
        const progress = Math.min((spent / Number(budget.amount)) * 100, 100);
        const isOverBudget = spent > Number(budget.amount);

        return (
          <Card key={budget.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{category?.name}</span>
                <span className={isOverBudget ? "text-red-600" : ""}>
                  ${spent.toFixed(2)} / ${Number(budget.amount).toFixed(2)}
                </span>
              </div>
              <Progress
                value={progress}
                className={isOverBudget ? "bg-red-200" : ""}
              />
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
