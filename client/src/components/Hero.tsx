import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Beach_lifestyle_hero_image_f212e916.png";

export function Hero() {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <h1
          className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
          data-testid="text-hero-title"
        >
          Beach Life, Your Style
        </h1>
        <p
          className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl md:text-2xl"
          data-testid="text-hero-subtitle"
        >
          Custom t-shirt designs inspired by the Jersey Shore.
          <br />
          Designed by locals, loved by beach communities.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={scrollToProducts}
            className="text-base uppercase tracking-wide"
            data-testid="button-shop-now"
          >
            Shop Now
          </Button>
        </div>
        <p className="mt-8 text-sm text-white/80" data-testid="text-trust-indicator">
          Free shipping on orders over $50
        </p>
      </div>
    </section>
  );
}
