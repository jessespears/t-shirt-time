import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateCartTotals,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  getCart,
  clearCart,
  type CartItem
} from '../lib/cart';
import type { Product } from '@shared/schema';

// Mock dispatchEvent
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

describe('Cart Utilities', () => {
  let localStorageMock: Storage;

  beforeEach(() => {
    // Create fresh localStorage mock for each test
    const store: Record<string, string> = {};
    localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
      key: (index: number) => null,
      length: 0,
    };

    // Replace global localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });

    dispatchEventSpy.mockClear();
  });

  describe('calculateCartTotals', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Shirt',
      description: 'A test t-shirt',
      price: '29.99', // Note: Price is a string (decimal column)
      imageUrl: '/test.jpg',
      availableSizes: ['S', 'M', 'L'],
      availableColors: ['Blue', 'Red'],
      stockQuantity: 100,
      lowStockThreshold: 10,
    };

    it('should calculate subtotal for single item', () => {
      const cart: CartItem[] = [
        {
          product: mockProduct,
          size: 'M',
          color: 'Blue',
          quantity: 2,
        },
      ];

      const { subtotal } = calculateCartTotals(cart);
      // Verify it parses string price correctly
      expect(subtotal).toBeCloseTo(59.98, 2);
    });

    it('should calculate NJ sales tax at 8.5%', () => {
      const cart: CartItem[] = [
        {
          product: { ...mockProduct, price: '100.00' },
          size: 'M',
          color: 'Blue',
          quantity: 1,
        },
      ];

      const { tax } = calculateCartTotals(cart);
      expect(tax).toBeCloseTo(8.5, 2);
    });

    it('should calculate total with subtotal and tax', () => {
      const cart: CartItem[] = [
        {
          product: mockProduct,
          size: 'M',
          color: 'Blue',
          quantity: 1,
        },
      ];

      const { subtotal, tax, total } = calculateCartTotals(cart);
      expect(total).toBeCloseTo(subtotal + tax, 2);
      expect(total).toBeCloseTo(32.54, 2);
    });

    it('should handle multiple items correctly', () => {
      const cart: CartItem[] = [
        {
          product: mockProduct,
          size: 'M',
          color: 'Blue',
          quantity: 2,
        },
        {
          product: { ...mockProduct, id: '2', price: '24.99' },
          size: 'L',
          color: 'Red',
          quantity: 1,
        },
      ];

      const { subtotal, tax, total } = calculateCartTotals(cart);
      expect(subtotal).toBeCloseTo(84.97, 2);
      expect(tax).toBeCloseTo(7.22, 2);
      expect(total).toBeCloseTo(92.19, 2);
    });

    it('should return zero for empty cart', () => {
      const cart: CartItem[] = [];
      const { subtotal, tax, total } = calculateCartTotals(cart);

      expect(subtotal).toBe(0);
      expect(tax).toBe(0);
      expect(total).toBe(0);
    });
  });

  describe('addToCart', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Beach Shirt',
      description: 'Cool beach shirt',
      price: '29.99',
      imageUrl: '/beach.jpg',
      availableSizes: ['S', 'M', 'L'],
      availableColors: ['Blue', 'White'],
      stockQuantity: 50,
      lowStockThreshold: 10,
    };

    it('should add new item to empty cart', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      const cart = getCart();

      expect(cart).toHaveLength(1);
      expect(cart[0].product.id).toBe('1');
      expect(cart[0].size).toBe('M');
      expect(cart[0].color).toBe('Blue');
      expect(cart[0].quantity).toBe(1);
    });

    it('should increment quantity for existing item', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      addToCart(mockProduct, 'M', 'Blue', 2);
      const cart = getCart();

      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(3);
    });

    it('should add separate item for different size', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      addToCart(mockProduct, 'L', 'Blue', 1);
      const cart = getCart();

      expect(cart).toHaveLength(2);
    });

    it('should dispatch cart-updated event', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Shirt',
      description: 'Test',
      price: '29.99',
      imageUrl: '/test.jpg',
      availableSizes: ['M'],
      availableColors: ['Blue'],
      stockQuantity: 50,
      lowStockThreshold: 10,
    };

    it('should remove item from cart', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      removeFromCart('1', 'M', 'Blue');
      const cart = getCart();

      expect(cart).toHaveLength(0);
    });

    it('should only remove matching item', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      addToCart(mockProduct, 'L', 'Blue', 1);
      removeFromCart('1', 'M', 'Blue');
      const cart = getCart();

      expect(cart).toHaveLength(1);
      expect(cart[0].size).toBe('L');
    });

    it('should handle removing nonexistent item gracefully', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      removeFromCart('999', 'XL', 'Red');
      const cart = getCart();

      // Original item should still be there
      expect(cart).toHaveLength(1);
      expect(cart[0].product.id).toBe('1');
    });
  });

  describe('updateCartItemQuantity', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Shirt',
      description: 'Test',
      price: '29.99',
      imageUrl: '/test.jpg',
      availableSizes: ['M'],
      availableColors: ['Blue'],
      stockQuantity: 50,
      lowStockThreshold: 10,
    };

    it('should update quantity of existing item', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      updateCartItemQuantity('1', 'M', 'Blue', 5);
      const cart = getCart();

      expect(cart[0].quantity).toBe(5);
    });

    it('should do nothing if item not found', () => {
      updateCartItemQuantity('999', 'XL', 'Red', 10);
      const cart = getCart();

      expect(cart).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Shirt',
      description: 'Test',
      price: '29.99',
      imageUrl: '/test.jpg',
      availableSizes: ['M'],
      availableColors: ['Blue'],
      stockQuantity: 50,
      lowStockThreshold: 10,
    };

    it('should clear all items from cart', () => {
      addToCart(mockProduct, 'M', 'Blue', 1);
      addToCart(mockProduct, 'L', 'Red', 2);
      clearCart();
      const cart = getCart();

      expect(cart).toHaveLength(0);
    });

    it('should dispatch cart-updated event', () => {
      clearCart();
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });
});
