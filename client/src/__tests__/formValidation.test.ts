import { describe, it, expect } from 'vitest';
import { insertProductSchema, insertOrderSchema } from '../../../shared/schema';

describe('Form Validation Schemas', () => {
  describe('Product Schema Validation', () => {
    it('should validate a complete valid product', () => {
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
      
      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Beach Shirt');
        expect(result.data.stockQuantity).toBe(100);
        expect(result.data.availableSizes).toHaveLength(4);
      }
    });

    it('should reject product with missing required name', () => {
      const invalidProduct = {
        description: 'Test',
        price: '29.99',
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      };

      const result = insertProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should allow empty description (not required to be non-empty)', () => {
      const product = {
        name: 'Test Shirt',
        description: '',
        price: '29.99',
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      };

      const result = insertProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it('should validate types correctly (price as string, quantities as numbers)', () => {
      const product = {
        name: 'Test Shirt',
        description: 'Test',
        price: '29.99', // Decimal column - string in database
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 100, // Integer column
        lowStockThreshold: 10, // Integer column
      };

      const result = insertProductSchema.safeParse(product);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Price should remain a string (decimal column)
        expect(typeof result.data.price).toBe('string');
        // Stock quantities are numbers
        expect(typeof result.data.stockQuantity).toBe('number');
        expect(typeof result.data.lowStockThreshold).toBe('number');
      }
    });

    it('should accept zero stock quantity', () => {
      const product = {
        name: 'Test Shirt',
        description: 'Test',
        price: '29.99',
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 0,
        lowStockThreshold: 5,
      };

      const result = insertProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });
  });

  describe('Order Schema Validation', () => {
    it('should validate a complete valid order', () => {
      const validOrder = {
        orderNumber: 'ORD-000001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '555-1234',
        shippingAddress: '123 Beach Ave',
        shippingCity: 'Ocean City',
        shippingState: 'NJ',
        shippingZip: '08226',
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
        stripePaymentIntentId: 'pi_test123',
        status: 'pending',
        paymentStatus: 'paid',
        updatedAt: new Date(),
      };

      const result = insertOrderSchema.safeParse(validOrder);
      
      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }
      
      expect(result.success).toBe(true);
    });

    it('should accept any string as email (basic schema validation)', () => {
      const order = {
        orderNumber: 'ORD-000002',
        customerName: 'John Doe',
        customerEmail: 'any-string-accepted',
        customerPhone: '555-1234',
        shippingAddress: '123 Beach Ave',
        shippingCity: 'Ocean City',
        shippingState: 'NJ',
        shippingZip: '08226',
        items: [],
        subtotal: '0',
        tax: '0',
        total: '0',
        status: 'pending',
        paymentStatus: 'unpaid',
        updatedAt: new Date(),
      };

      // Basic Drizzle schema accepts any string for text fields
      const result = insertOrderSchema.safeParse(order);
      expect(result.success).toBe(true);
    });

    it('should reject order with missing customer name', () => {
      const invalidOrder = {
        orderNumber: 'ORD-000003',
        customerEmail: 'john@example.com',
        customerPhone: '555-1234',
        shippingAddress: '123 Beach Ave',
        shippingCity: 'Ocean City',
        shippingState: 'NJ',
        shippingZip: '08226',
        items: [],
        subtotal: '0',
        tax: '0',
        total: '0',
        status: 'pending',
        paymentStatus: 'unpaid',
        updatedAt: new Date(),
      };

      const result = insertOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should validate order status enum values', () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      validStatuses.forEach(status => {
        const order = {
          orderNumber: `ORD-00000${validStatuses.indexOf(status) + 4}`,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '555-1234',
          shippingAddress: '123 Beach Ave',
          shippingCity: 'Ocean City',
          shippingState: 'NJ',
          shippingZip: '08226',
          items: [],
          subtotal: '0',
          tax: '0',
          total: '0',
          status,
          paymentStatus: 'unpaid',
          updatedAt: new Date(),
        };

        const result = insertOrderSchema.safeParse(order);
        expect(result.success).toBe(true);
      });
    });

    it('should accept any string as status (schema has default but no enum)', () => {
      const order = {
        orderNumber: 'ORD-000009',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '555-1234',
        shippingAddress: '123 Beach Ave',
        shippingCity: 'Ocean City',
        shippingState: 'NJ',
        shippingZip: '08226',
        items: [],
        subtotal: '0',
        tax: '0',
        total: '0',
        status: 'custom-status',
        paymentStatus: 'unpaid',
        updatedAt: new Date(),
      };

      // Basic Drizzle schema accepts any varchar value
      const result = insertOrderSchema.safeParse(order);
      expect(result.success).toBe(true);
    });
  });
});
