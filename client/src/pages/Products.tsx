import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { Header } from "@/components/Header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Products() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Beach Tees Collection
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover our exclusive line of beach-inspired t-shirts
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No products available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden transition-all hover-elevate"
                data-testid={`card-product-${product.id}`}
              >
                <Link href={`/products/${product.id}`}>
                  <div className="cursor-pointer">
                    <div className="aspect-square overflow-hidden bg-muted">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          data-testid={`img-product-${product.id}`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <span className="text-lg font-medium text-muted-foreground">
                            {product.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3
                        className="font-heading text-lg font-semibold"
                        data-testid={`text-product-name-${product.id}`}
                      >
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between p-4 pt-0">
                      <span
                        className="font-heading text-xl font-bold text-primary"
                        data-testid={`text-price-${product.id}`}
                      >
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <Button variant="default" size="sm">
                        View Details
                      </Button>
                    </CardFooter>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
