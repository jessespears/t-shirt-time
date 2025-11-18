import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Product } from "@shared/schema";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.id],
    enabled: !!params?.id,
  });

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} (${selectedSize}, ${selectedColor})`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              data-testid="img-product-detail"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h1
                className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
                data-testid="text-product-name"
              >
                {product.name}
              </h1>
              <p
                className="mt-4 text-3xl font-bold text-primary"
                data-testid="text-product-price"
              >
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            <p className="text-base leading-relaxed text-muted-foreground" data-testid="text-product-description">
              {product.description}
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Size</Label>
                <RadioGroup
                  value={selectedSize}
                  onValueChange={setSelectedSize}
                  className="mt-3 grid grid-cols-4 gap-2"
                >
                  {product.availableSizes.map((size) => (
                    <div key={size}>
                      <RadioGroupItem
                        value={size}
                        id={`size-${size}`}
                        className="peer sr-only"
                        data-testid={`radio-size-${size}`}
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className="flex h-10 cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-background hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Color</Label>
                <RadioGroup
                  value={selectedColor}
                  onValueChange={setSelectedColor}
                  className="mt-3 flex flex-wrap gap-3"
                >
                  {product.availableColors.map((color) => (
                    <div key={color}>
                      <RadioGroupItem
                        value={color}
                        id={`color-${color}`}
                        className="peer sr-only"
                        data-testid={`radio-color-${color}`}
                      />
                      <Label
                        htmlFor={`color-${color}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-muted hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary peer-data-[state=checked]:ring-offset-2"
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Quantity</Label>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-medium" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full text-base uppercase tracking-wide"
              onClick={handleAddToCart}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
