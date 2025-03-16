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
import { insertTransactionSchema, Category, InsertTransaction, Transaction } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

type TransactionFormProps = {
  categories: Category[];
  editTransaction?: Transaction;
};

export default function TransactionForm({ categories, editTransaction }: TransactionFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: 0,
      type: "expense",
      date: new Date().toISOString().slice(0, 10), // Format as YYYY-MM-DD
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editTransaction) {
      form.reset({
        amount: editTransaction.amount.toString(),
        description: editTransaction.description,
        categoryId: editTransaction.categoryId,
        type: editTransaction.type,
        date: new Date(editTransaction.date).toISOString().slice(0, 10),
      });
    }
  }, [editTransaction, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const formattedData = {
        ...data,
        categoryId: Number(data.categoryId),
      };

      const url = editTransaction 
        ? `/api/transactions/${editTransaction.id}`
        : "/api/transactions";

      const method = editTransaction ? "PATCH" : "POST";

      const res = await apiRequest(method, url, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      if (!editTransaction) {
        form.reset();
      }
      toast({
        title: "Success",
        description: editTransaction 
          ? "Transaction updated successfully"
          : "Transaction added successfully",
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

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={form.watch("type")}
          onValueChange={(value) => {
            form.setValue("type", value as "income" | "expense");
            form.setValue("categoryId", 0); // Reset category when type changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.watch("categoryId").toString()}
          onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter(category => category.type === form.watch("type"))
              .map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {form.formState.errors.categoryId && (
          <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (PKR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter amount"
          {...form.register("amount")}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description" 
          placeholder="Enter description"
          {...form.register("description")} 
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...form.register("date")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editTransaction ? 'Update Transaction' : 'Add Transaction'}
      </Button>
    </form>
  );
}