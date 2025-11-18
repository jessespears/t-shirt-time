import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getCart } from "@/lib/cart";

export function Header() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = getCart();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCount();
    window.addEventListener("cart-updated", updateCount);
    return () => window.removeEventListener("cart-updated", updateCount);
  }, []);

  const isAdminRoute = location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" data-testid="link-home">
          <span className="flex items-center gap-2 cursor-pointer">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
              T-Shirt Time
            </h1>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdminRoute && isAuthenticated && (
            <>
              <Link href="/admin/dashboard" data-testid="link-products">
                <Button variant={location === "/admin/dashboard" ? "default" : "ghost"} size="sm">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/orders" data-testid="link-orders">
                <Button variant={location === "/admin/orders" ? "default" : "ghost"} size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </Button>
              </Link>
            </>
          )}
          
          {!isAdminRoute && (
            <Link href="/cart" data-testid="link-cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
                    data-testid="badge-cart-count"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.location.href = "/api/logout")}
              data-testid="button-logout"
            >
              <User className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/admin/login" data-testid="link-admin">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
