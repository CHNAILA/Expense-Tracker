import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertBudgetSchema, Category, InsertBudget } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

type BudgetFormProps = {
  categories: Category[];
};

export default function BudgetForm({ categories }: BudgetFormProps) {
  const { toast } = useToast();
  const currentDate = new Date();
  
  const form = useForm<InsertBudget>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      amount: "",
      categoryId: 0,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertBudget) => {
      const formattedData = {
        ...data,
        categoryId: Number(data.categoryId),
      };
      const res = await apiRequest("POST", "/api/budgets", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      form.reset();
      toast({
        title: "Success",
        description: "Budget set successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Budget Amount (PKR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter budget amount"
          {...form.register("amount")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Set Budget
      </Button>
    </form>
  );
}
