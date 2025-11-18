import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "wouter";
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  calculateCartTotals,
  CartItem,
} from "@/lib/cart";

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = () => setCartItems(getCart());
    loadCart();

    window.addEventListener("cart-updated", loadCart);
    return () => window.removeEventListener("cart-updated", loadCart);
  }, []);

  const { subtotal, tax, total } = calculateCartTotals(cartItems);

  const handleUpdateQuantity = (
    productId: string,
    size: string,
    color: string,
    newQuantity: number
  ) => {
    if (newQuantity > 0) {
      updateCartItemQuantity(productId, size, color, newQuantity);
    }
  };

  const handleRemove = (productId: string, size: string, color: string) => {
    removeFromCart(productId, size, color);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <h1
          className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          data-testid="text-page-title"
        >
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground" data-testid="text-empty-cart">
              Your cart is empty
            </p>
            <Link href="/">
              <a>
                <Button className="mt-6" data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </a>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  data-testid={`card-cart-item-${item.product.id}`}
                >
                  <CardContent className="flex gap-4 p-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="font-heading font-semibold">
                            {item.product.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Size: {item.size} | Color: {item.color}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemove(item.product.id, item.size, item.color)
                          }
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.product.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                            data-testid={`button-increase-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <p className="font-bold" data-testid={`text-item-total-${item.product.id}`}>
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-heading text-xl font-bold">Order Summary</h2>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (8.5%)</span>
                      <span data-testid="text-tax">${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span data-testid="text-total">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <a className="block">
                      <Button className="w-full uppercase tracking-wide" data-testid="button-checkout">
                        Proceed to Checkout
                      </Button>
                    </a>
                  </Link>

                  <Link href="/">
                    <a className="block">
                      <Button variant="outline" className="w-full" data-testid="button-continue-shopping-summary">
                        Continue Shopping
                      </Button>
                    </a>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
