
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AlertCircle, Trash } from "lucide-react";
import { Budget, Category } from "@shared/schema";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type BudgetListProps = {
  budgets: Budget[];
  transactions: any[];
  categories: Category[];
};

export default function BudgetList({
  budgets,
  transactions,
  categories,
}: BudgetListProps) {
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const deleteBudget = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete budget");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
      setDeletingBudgetId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = (id: number) => {
    setDeletingBudgetId(id);
  };

  const handleDelete = () => {
    if (deletingBudgetId) {
      deleteBudget.mutate(deletingBudgetId);
    }
  };

  return (
    <>
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
                  <div className="flex items-center gap-2">
                    <span className={isOverBudget ? "text-red-500 font-semibold" : ""}>
                      ${spent.toFixed(2)} / ${Number(budget.amount).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => confirmDelete(budget.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
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
          <div className="text-center text-muted-foreground py-4">
            No budgets set for this month
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => !open && setDeletingBudgetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this budget. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
