import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCart, calculateCartTotals, clearCart, CartItem } from "@/lib/cart";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingState: z.string().min(2, "State is required"),
  shippingZip: z.string().min(5, "ZIP code must be at least 5 digits"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function PaymentForm({ 
  shippingInfo, 
  cartItems,
  subtotal,
  tax,
  total,
  orderNumber
}: { 
  shippingInfo: CheckoutForm;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderNumber: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      }));

      return await apiRequest("POST", "/api/orders", {
        orderNumber,
        ...shippingInfo,
        items,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        stripePaymentIntentId: paymentIntentId,
        status: "pending",
        paymentStatus: "paid",
      });
    },
    onSuccess: () => {
      clearCart();
      setLocation(`/confirmation/${orderNumber}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${orderNumber}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      createOrderMutation.mutate(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full uppercase tracking-wide"
        disabled={!stripe || isProcessing || createOrderMutation.isPending}
        data-testid="button-pay"
      >
        {isProcessing || createOrderMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shippingInfo, setShippingInfo] = useState<CheckoutForm | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [generatedOrderNumber] = useState(`TS${Date.now()}`);
  const [serverTotals, setServerTotals] = useState<{subtotal: number, tax: number, total: number} | null>(null);

  useEffect(() => {
    const items = getCart();
    setCartItems(items);

    if (items.length === 0) {
      setLocation("/");
    }
  }, [setLocation]);

  const { subtotal, tax, total } = serverTotals || calculateCartTotals(cartItems);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingZip: "",
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        items,
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (!data.clientSecret || !data.subtotal || !data.tax || !data.total) {
        toast({
          title: "Payment setup failed",
          description: "Received invalid payment data from server",
          variant: "destructive",
        });
        return;
      }

      const parsedSubtotal = parseFloat(data.subtotal);
      const parsedTax = parseFloat(data.tax);
      const parsedTotal = parseFloat(data.total);

      if (!isFinite(parsedSubtotal) || !isFinite(parsedTax) || !isFinite(parsedTotal)) {
        toast({
          title: "Payment setup failed",
          description: "Received invalid payment amounts from server",
          variant: "destructive",
        });
        return;
      }

      setClientSecret(data.clientSecret);
      setServerTotals({
        subtotal: parsedSubtotal,
        tax: parsedTax,
        total: parsedTotal,
      });
      setStep("payment");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onShippingSubmit = (data: CheckoutForm) => {
    setShippingInfo(data);
    createPaymentIntentMutation.mutate();
  };

  if (step === "payment" && clientSecret && shippingInfo && serverTotals) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h1
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              data-testid="text-page-title"
            >
              Payment
            </h1>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm 
                        shippingInfo={shippingInfo}
                        cartItems={cartItems}
                        subtotal={subtotal}
                        tax={tax}
                        total={total}
                        orderNumber={generatedOrderNumber}
                      />
                    </Elements>
                  </CardContent>
                </Card>

                <Button
                  variant="ghost"
                  onClick={() => setStep("shipping")}
                  className="mt-4"
                  data-testid="button-back"
                >
                  ← Back to Shipping
                </Button>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl font-bold">Order Summary</h2>

                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={`${item.product.id}-${item.size}-${item.color}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span>
                            ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          <h1
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            data-testid="text-page-title"
          >
            Checkout
          </h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 123-4567"
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shippingAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 Beach Ave"
                                {...field}
                                data-testid="input-address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="shippingCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ocean City"
                                  {...field}
                                  data-testid="input-city"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shippingState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="NJ"
                                  {...field}
                                  data-testid="input-state"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shippingZip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="08226"
                                  {...field}
                                  data-testid="input-zip"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full uppercase tracking-wide"
                        disabled={createPaymentIntentMutation.isPending}
                        data-testid="button-continue-payment"
                      >
                        {createPaymentIntentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Continue to Payment"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-heading text-xl font-bold">Order Summary</h2>

                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span>
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
