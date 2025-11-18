import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { Order } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isUnauthorizedError, isForbiddenError } from "@/lib/authUtils";

export default function Orders() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  useEffect(() => {
    if (ordersError && isForbiddenError(ordersError as Error)) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges. Please contact the store owner.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    }
  }, [ordersError, setLocation, toast]);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) => {
      return await apiRequest("PATCH", `/api/orders/${id}`, { status, paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      if (isForbiddenError(error)) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
        return;
      }
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, currentStatus: string, currentPaymentStatus: string, field: 'status' | 'paymentStatus', value: string) => {
    updateOrderMutation.mutate({
      id: orderId,
      status: field === 'status' ? value : currentStatus,
      paymentStatus: field === 'paymentStatus' ? value : currentPaymentStatus,
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8">
          <h1
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            data-testid="text-page-title"
          >
            Order Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.items as Array<{productId: string, name: string, price: string, size: string, color: string, quantity: number}>;
              return (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.createdAt!).toLocaleDateString()} at {new Date(order.createdAt!).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'outline'} data-testid={`badge-status-${order.id}`}>
                        {order.status}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} data-testid={`badge-payment-${order.id}`}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold mb-2">Customer Details</h3>
                        <p className="text-sm">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        <p className="text-sm">{order.shippingAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingCity}, {order.shippingState} {order.shippingZip}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Items</h3>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-muted-foreground">
                                Size: {item.size}, Color: {item.color} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <div className="space-y-1 text-sm">
                        <p>Subtotal: ${parseFloat(order.subtotal).toFixed(2)}</p>
                        <p>Tax: ${parseFloat(order.tax).toFixed(2)}</p>
                        <p className="font-bold text-base">Total: ${parseFloat(order.total).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Order Status</label>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, order.status, order.paymentStatus, 'status', value)}
                            data-testid={`select-order-status-${order.id}`}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Payment Status</label>
                          <Select
                            value={order.paymentStatus}
                            onValueChange={(value) => handleStatusChange(order.id, order.status, order.paymentStatus, 'paymentStatus', value)}
                            data-testid={`select-payment-status-${order.id}`}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Orders will appear here as customers make purchases
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
