import { Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} data-testid={`card-product-${product.id}`}>
      <Card className="group overflow-hidden hover-elevate active-elevate-2 transition-transform duration-200 cursor-pointer">
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            data-testid={`img-product-${product.id}`}
          />
        </div>
        <CardContent className="p-4">
          <h3
            className="font-heading text-lg font-semibold line-clamp-1"
            data-testid={`text-product-name-${product.id}`}
          >
            {product.name}
          </h3>
          <p
            className="mt-2 text-xl font-bold text-primary"
            data-testid={`text-product-price-${product.id}`}
          >
            ${parseFloat(product.price).toFixed(2)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {product.availableColors.slice(0, 4).map((color) => (
              <div
                key={color}
                className="h-5 w-5 rounded-full border-2 border-border"
                style={{
                  backgroundColor: color.toLowerCase(),
                }}
                title={color}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
