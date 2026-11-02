import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setBusy(true);
    setError("");
    try {
      if (isLogin) await login(email, password);
      else await register(String(form.get("name")), email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{isLogin ? "Sign in" : "Create an account"}</CardTitle>
            <CardDescription>{isLogin ? "Use your email and password." : "It takes a few seconds."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required autoComplete="name" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={busy}>
              {isLogin ? "Sign in" : "Create account"}
            </Button>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "No account yet? " : "Already registered? "}
              <Link to={isLogin ? "/register" : "/login"} className="text-foreground underline">
                {isLogin ? "Create one" : "Sign in"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
