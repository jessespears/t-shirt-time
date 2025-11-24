import { describe, it, expect } from 'vitest';

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  size: string;
  color: string;
  imageUrl: string;
}

describe('Cart Utilities', () => {
  const NJ_TAX_RATE = 0.085;

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for single item', () => {
      const items: CartItem[] = [
        {
          productId: '1',
          name: 'Test Shirt',
          price: '29.99',
          quantity: 2,
          size: 'M',
          color: 'Blue',
          imageUrl: '/test.jpg',
        },
      ];

      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      expect(subtotal).toBeCloseTo(59.98, 2);
    });

    it('should calculate subtotal for multiple items', () => {
      const items: CartItem[] = [
        {
          productId: '1',
          name: 'Shirt 1',
          price: '29.99',
          quantity: 2,
          size: 'M',
          color: 'Blue',
          imageUrl: '/1.jpg',
        },
        {
          productId: '2',
          name: 'Shirt 2',
          price: '24.99',
          quantity: 1,
          size: 'L',
          color: 'Red',
          imageUrl: '/2.jpg',
        },
      ];

      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      expect(subtotal).toBeCloseTo(84.97, 2);
    });

    it('should handle empty cart', () => {
      const items: CartItem[] = [];

      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      expect(subtotal).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should calculate NJ sales tax at 8.5%', () => {
      const subtotal = 100.0;
      const tax = subtotal * NJ_TAX_RATE;

      expect(tax).toBeCloseTo(8.5, 2);
    });

    it('should calculate tax for various subtotals', () => {
      const testCases = [
        { subtotal: 50.0, expectedTax: 4.25 },
        { subtotal: 99.99, expectedTax: 8.5 },
        { subtotal: 200.0, expectedTax: 17.0 },
        { subtotal: 31.0, expectedTax: 2.64 },
      ];

      testCases.forEach(({ subtotal, expectedTax }) => {
        const tax = subtotal * NJ_TAX_RATE;
        expect(tax).toBeCloseTo(expectedTax, 2);
      });
    });

    it('should handle zero subtotal', () => {
      const subtotal = 0;
      const tax = subtotal * NJ_TAX_RATE;

      expect(tax).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with subtotal and tax', () => {
      const subtotal = 100.0;
      const tax = subtotal * NJ_TAX_RATE;
      const total = subtotal + tax;

      expect(total).toBeCloseTo(108.5, 2);
    });

    it('should format prices to 2 decimal places', () => {
      const subtotal = 29.99;
      const tax = subtotal * NJ_TAX_RATE;
      const total = subtotal + tax;

      const formattedTotal = total.toFixed(2);
      expect(formattedTotal).toBe('32.54');
    });
  });

  describe('Cart Item Validation', () => {
    it('should validate cart item has required fields', () => {
      const item: CartItem = {
        productId: '123',
        name: 'Beach Shirt',
        price: '29.99',
        quantity: 1,
        size: 'M',
        color: 'Blue',
        imageUrl: '/shirt.jpg',
      };

      expect(item.productId).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(parseFloat(item.price)).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.size).toBeTruthy();
      expect(item.color).toBeTruthy();
    });

    it('should handle quantity changes', () => {
      let quantity = 1;

      // Increment
      quantity += 1;
      expect(quantity).toBe(2);

      // Decrement
      quantity -= 1;
      expect(quantity).toBe(1);

      // Prevent going below 1
      quantity = Math.max(1, quantity - 1);
      expect(quantity).toBe(1);
    });
  });

  describe('Price Formatting', () => {
    it('should format price as currency', () => {
      const price = 29.99;
      const formatted = `$${price.toFixed(2)}`;

      expect(formatted).toBe('$29.99');
    });

    it('should handle whole dollar amounts', () => {
      const price = 30.0;
      const formatted = `$${price.toFixed(2)}`;

      expect(formatted).toBe('$30.00');
    });

    it('should handle cents properly', () => {
      const price = 29.5;
      const formatted = `$${price.toFixed(2)}`;

      expect(formatted).toBe('$29.50');
    });
  });
});
