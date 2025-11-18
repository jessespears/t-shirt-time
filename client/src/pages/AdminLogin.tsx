import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogin() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/admin/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container flex items-center justify-center px-4 py-12 md:py-24">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">Store Owner Login</CardTitle>
            <CardDescription>
              Sign in to manage your t-shirt designs and inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full uppercase tracking-wide"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-replit-login"
            >
              Sign In with Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
