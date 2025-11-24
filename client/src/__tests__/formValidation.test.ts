import { describe, it, expect } from 'vitest';
import { insertProductSchema, insertOrderSchema } from '../../../shared/schema';

describe('Form Validation Schemas', () => {
  describe('Product Schema Validation', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Beach Shirt',
        description: 'A cool beach-themed t-shirt',
        price: '29.99',
        imageUrl: '/images/shirt.jpg',
        availableSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['Blue', 'Red', 'White'],
        stockQuantity: 100,
        lowStockThreshold: 10,
      };

      const result = insertProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject product with missing required fields', () => {
      const invalidProduct = {
        name: 'Beach Shirt',
        // Missing other required fields
      };

      const result = insertProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should validate stock quantities are numbers', () => {
      const productWithValidStock = {
        name: 'Test Shirt',
        description: 'Test',
        price: '29.99',
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 100,
        lowStockThreshold: 10,
      };

      const result = insertProductSchema.safeParse(productWithValidStock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.stockQuantity).toBe('number');
        expect(typeof result.data.lowStockThreshold).toBe('number');
      }
    });
  });

  describe('Order Schema Validation', () => {
    it('should validate a valid order', () => {
      const validOrder = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        shippingAddress: '123 Beach Ave, Ocean City, NJ 08226',
        items: [
          {
            productId: 'prod-123',
            productName: 'Beach Shirt',
            size: 'L',
            color: 'Blue',
            quantity: 2,
            price: '29.99',
          },
        ],
        subtotal: '59.98',
        tax: '5.10',
        total: '65.08',
        paymentIntentId: 'pi_test123',
        status: 'pending',
      };

      const result = insertOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const orderWithInvalidEmail = {
        customerName: 'John Doe',
        customerEmail: 'not-an-email',
        shippingAddress: '123 Beach Ave',
        items: [],
        subtotal: '0',
        tax: '0',
        total: '0',
        paymentIntentId: 'pi_test',
        status: 'pending',
      };

      const result = insertOrderSchema.safeParse(orderWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it('should validate order status is valid enum value', () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      validStatuses.forEach(status => {
        const order = {
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          shippingAddress: '123 Beach Ave',
          items: [],
          subtotal: '0',
          tax: '0',
          total: '0',
          paymentIntentId: 'pi_test',
          status,
        };

        const result = insertOrderSchema.safeParse(order);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@gmail.com',
        'name123@domain.org',
      ];

      validEmails.forEach(email => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach(email => {
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
});
