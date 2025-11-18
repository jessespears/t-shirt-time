import { Product } from "@shared/schema";

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

const CART_STORAGE_KEY = "tshirt-time-cart";
const TAX_RATE = 0.085; // 8.5% NJ tax

export function getCart(): CartItem[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(product: Product, size: string, color: string, quantity: number = 1): void {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (item) =>
      item.product.id === product.id &&
      item.size === size &&
      item.color === color
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product, size, color, quantity });
  }

  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function removeFromCart(productId: string, size: string, color: string): void {
  const cart = getCart();
  const filtered = cart.filter(
    (item) =>
      !(item.product.id === productId && item.size === size && item.color === color)
  );
  saveCart(filtered);
  window.dispatchEvent(new Event("cart-updated"));
}

export function updateCartItemQuantity(
  productId: string,
  size: string,
  color: string,
  quantity: number
): void {
  const cart = getCart();
  const item = cart.find(
    (item) =>
      item.product.id === productId && item.size === size && item.color === color
  );

  if (item) {
    item.quantity = quantity;
    saveCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function calculateCartTotals(cart: CartItem[]): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { subtotal, tax, total };
}
