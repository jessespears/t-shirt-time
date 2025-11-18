import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import { Order } from "@shared/schema";

export default function Confirmation() {
  const [, params] = useRoute("/confirmation/:orderNumber");

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/orders", params?.orderNumber],
    enabled: !!params?.orderNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
        </div>
      </div>
    );
  }

  const items = order.items as any[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" data-testid="icon-success" />
            <h1
              className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              data-testid="text-page-title"
            >
              Order Confirmed!
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Thank you for your order. We'll send a confirmation email shortly.
            </p>
          </div>

          <Card className="mt-12">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold">Order Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Order Number:{" "}
                  <span className="font-mono font-semibold text-foreground" data-testid="text-order-number">
                    {order.orderNumber}
                  </span>
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium">Shipping Information</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p data-testid="text-customer-name">{order.customerName}</p>
                  <p data-testid="text-customer-email">{order.customerEmail}</p>
                  <p data-testid="text-customer-phone">{order.customerPhone}</p>
                  <p className="pt-2">
                    {order.shippingAddress}
                    <br />
                    {order.shippingCity}, {order.shippingState} {order.shippingZip}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium">Order Items</h3>
                <div className="mt-3 space-y-3">
                  {items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm"
                      data-testid={`item-${index}`}
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-subtotal">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span data-testid="text-tax">${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/">
              <a>
                <Button size="lg" className="uppercase tracking-wide" data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
