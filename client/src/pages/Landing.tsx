import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Landing() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <section id="products" className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              data-testid="text-products-heading"
            >
              Our Collection
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore our latest beach-inspired designs
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground" data-testid="text-no-products">
                No products available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 T-Shirt Time. Bringing Jersey Shore style to your wardrobe.
          </p>
        </div>
      </footer>
    </div>
  );
}
