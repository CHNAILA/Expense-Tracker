import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0D1321]">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-[#0D1321] border-[#C5832B]/20">
          <CardHeader>
            <CardTitle className="text-[#C5832B] text-3xl mb-2">Welcome to Your</CardTitle>
            <CardTitle className="text-[#C5832B] text-4xl font-bold">Expense Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
      <div className="hidden md:flex flex-col justify-center p-8 bg-[#C5832B] text-white">
        <h1 className="text-4xl font-bold mb-4">Track Your Expenses</h1>
        <p className="text-lg mb-8">
          Take control of your finances with our easy-to-use expense tracking
          solution.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/10">
            <h3 className="font-semibold mb-2">Track Transactions</h3>
            <p>Record and categorize your income and expenses</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <h3 className="font-semibold mb-2">Set Budgets</h3>
            <p>Create budgets and monitor your spending</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      cnic: "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
      className="space-y-4 mt-4"
    >
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...form.register("username")} />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnic">CNIC</Label>
        <Input 
          id="cnic" 
          placeholder="12345-1234567-1"
          {...form.register("cnic")}
        />
        {form.formState.errors.cnic && (
          <p className="text-sm text-red-500">{form.formState.errors.cnic.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#C5832B] hover:bg-[#C5832B]/90"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Login
      </Button>
    </form>
  );
}