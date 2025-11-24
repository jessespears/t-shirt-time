import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Database Integration Tests
 * 
 * These tests verify actual database operations against a real PostgreSQL instance.
 * Unlike unit tests with MockStorage, these tests ensure:
 * - Database constraints are enforced
 * - Transactions work correctly
 * - Data types are handled properly
 * - Stock updates are accurate through createOrderWithStockUpdate
 * 
 * IMPORTANT: Each test uses unique identifiers (UUIDs) and comprehensive cleanup
 * to avoid test contamination and ensure deterministic results.
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for integration tests');
}

// Track created test data for cleanup
const testProductIds = new Set<string>();
const testOrderNumbers = new Set<string>();

// Helper to generate unique test identifiers
function generateTestOrderNumber(): string {
  const orderNum = `TEST-${randomUUID()}`;
  testOrderNumbers.add(orderNum);
  return orderNum;
}

function generateTestProductName(): string {
  return `Test-Product-${randomUUID().slice(0, 8)}`;
}

// Cleanup all test data from previous runs (including crashed tests)
async function cleanupAllPreviousTestData() {
  try {
    // Delete ALL test orders (from any previous runs)
    await db.delete(schema.orders).where(sql`${schema.orders.orderNumber} LIKE 'TEST-%'`);
    
    // Delete ALL test products (from any previous runs)
    await db.delete(schema.products).where(sql`${schema.products.name} LIKE 'Test-Product-%'`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Comprehensive cleanup helper that removes current run's test data
async function cleanupCurrentTestData() {
  try {
    // Delete current run's test orders
    if (testOrderNumbers.size > 0) {
      await db.delete(schema.orders).where(
        sql`${schema.orders.orderNumber} IN (${sql.join(Array.from(testOrderNumbers).map(n => sql`${n}`), sql`, `)})`
      );
    }
    
    // Delete current run's test products
    if (testProductIds.size > 0) {
      await db.delete(schema.products).where(
        sql`${schema.products.id} IN (${sql.join(Array.from(testProductIds).map(id => sql`${id}`), sql`, `)})`
      );
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Clean up ALL test data from previous runs (including crashed tests)
    // This ensures deterministic results even if previous runs failed
    await cleanupAllPreviousTestData();
  });

  afterEach(async () => {
    // Clean up after each test - use finally-style approach
    try {
      await cleanupCurrentTestData();
    } finally {
      testProductIds.clear();
      testOrderNumbers.clear();
    }
  });

  afterAll(async () => {
    // Final cleanup - remove all test data
    await cleanupAllPreviousTestData();
  });

  describe('Product CRUD Operations', () => {
    it('should create a product with all fields', async () => {
      const productName = generateTestProductName();
      const product = await storage.createProduct({
        name: productName,
        description: 'A test product',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue'],
        stockQuantity: 100,
      });

      testProductIds.add(product.id);

      expect(product.id).toBeDefined();
      expect(product.name).toBe(productName);
      expect(product.price).toBe('29.99');
      expect(product.availableSizes).toEqual(['S', 'M', 'L']);
      expect(product.availableColors).toEqual(['Red', 'Blue']);
      expect(product.stockQuantity).toBe(100);
    });

    it('should retrieve a product by ID', async () => {
      const productName = generateTestProductName();
      const created = await storage.createProduct({
        name: productName,
        description: 'A test product',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue'],
        stockQuantity: 50,
      });

      testProductIds.add(created.id);

      const retrieved = await storage.getProduct(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(productName);
      expect(retrieved?.stockQuantity).toBe(50);
    });

    it('should return undefined for non-existent product', async () => {
      const product = await storage.getProduct(`non-existent-${randomUUID()}`);
      expect(product).toBeUndefined();
    });

    it('should list all products', async () => {
      const name1 = generateTestProductName();
      const name2 = generateTestProductName();

      const product1 = await storage.createProduct({
        name: name1,
        description: 'First test product',
        price: '19.99',
        imageUrl: 'https://example.com/image1.jpg',
        availableSizes: ['S', 'M'],
        availableColors: ['Red'],
        stockQuantity: 10,
      });
      testProductIds.add(product1.id);

      const product2 = await storage.createProduct({
        name: name2,
        description: 'Second test product',
        price: '24.99',
        imageUrl: 'https://example.com/image2.jpg',
        availableSizes: ['L', 'XL'],
        availableColors: ['Blue'],
        stockQuantity: 20,
      });
      testProductIds.add(product2.id);

      const products = await storage.getAllProducts();
      const testProducts = products.filter(p => 
        p.name === name1 || p.name === name2
      );

      expect(testProducts.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a product', async () => {
      const productName = generateTestProductName();
      const updatedName = generateTestProductName();
      
      const product = await storage.createProduct({
        name: productName,
        description: 'Original description',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M'],
        availableColors: ['Red'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);

      const updated = await storage.updateProduct(product.id, {
        name: updatedName,
        description: 'Updated description',
        price: '39.99',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M'],
        availableColors: ['Red'],
        stockQuantity: 50,
      });

      expect(updated.name).toBe(updatedName);
      expect(updated.description).toBe('Updated description');
      expect(updated.price).toBe('39.99');
      expect(updated.stockQuantity).toBe(50);
    });

    it('should delete a product', async () => {
      const productName = generateTestProductName();
      const product = await storage.createProduct({
        name: productName,
        description: 'To be deleted',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S'],
        availableColors: ['Red'],
        stockQuantity: 10,
      });

      const productId = product.id;
      testProductIds.add(productId);

      await storage.deleteProduct(productId);
      testProductIds.delete(productId); // Remove from tracking since it's deleted

      const retrieved = await storage.getProduct(productId);
      expect(retrieved).toBeUndefined();
    });

    it('should handle decimal prices correctly', async () => {
      const productName = generateTestProductName();
      const product = await storage.createProduct({
        name: productName,
        description: 'Price test',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 25,
      });
      testProductIds.add(product.id);

      // Database decimal columns return strings
      expect(typeof product.price).toBe('string');
      expect(product.price).toBe('31.00');
      
      // Verify it can be parsed as a number
      const priceNum = parseFloat(product.price);
      expect(priceNum).toBe(31.00);
    });

    it('should handle array types for sizes and colors', async () => {
      const productName = generateTestProductName();
      const product = await storage.createProduct({
        name: productName,
        description: 'Array test',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        availableColors: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'],
        stockQuantity: 10,
      });
      testProductIds.add(product.id);

      expect(Array.isArray(product.availableSizes)).toBe(true);
      expect(Array.isArray(product.availableColors)).toBe(true);
      expect(product.availableSizes).toHaveLength(6);
      expect(product.availableColors).toHaveLength(6);
    });
  });

  describe('Order Operations with Stock Updates', () => {
    it('should create an order with transactional stock update', async () => {
      const productName = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For order testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);
      const initialStock = product.stockQuantity;

      const order = await storage.createOrderWithStockUpdate(
        {
          orderNumber,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '1234567890',
          shippingAddress: '123 Beach St',
          shippingCity: 'Ocean City',
          shippingState: 'NJ',
          shippingZip: '08226',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'M',
              color: 'Blue',
              quantity: 2,
            },
          ],
          subtotal: '62.00',
          tax: '5.27',
          total: '67.27',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 2 }]
      );

      expect(order.id).toBeDefined();
      expect(order.orderNumber).toBe(orderNumber);
      expect(order.customerName).toBe('John Doe');
      expect(order.subtotal).toBe('62.00');
      expect(order.tax).toBe('5.27');
      expect(order.total).toBe('67.27');

      // Verify stock was reduced
      const updatedProduct = await storage.getProduct(product.id);
      expect(updatedProduct?.stockQuantity).toBe(initialStock - 2);
    });

    it('should store decimal amounts as strings', async () => {
      const productName = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For order testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);

      const order = await storage.createOrderWithStockUpdate(
        {
          orderNumber,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          customerPhone: '9876543210',
          shippingAddress: '456 Shore Ave',
          shippingCity: 'Atlantic City',
          shippingState: 'NJ',
          shippingZip: '08401',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'L',
              color: 'Red',
              quantity: 2,
            },
          ],
          subtotal: '62.00',
          tax: '5.27',
          total: '67.27',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 2 }]
      );

      // Verify decimal values are strings
      expect(typeof order.subtotal).toBe('string');
      expect(typeof order.tax).toBe('string');
      expect(typeof order.total).toBe('string');

      // Verify they can be parsed to numbers
      expect(parseFloat(order.subtotal)).toBe(62.00);
      expect(parseFloat(order.tax)).toBeCloseTo(5.27, 2);
      expect(parseFloat(order.total)).toBeCloseTo(67.27, 2);
    });

    it('should retrieve an order by order number', async () => {
      const productName = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For order testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);

      await storage.createOrderWithStockUpdate(
        {
          orderNumber,
          customerName: 'Bob Wilson',
          customerEmail: 'bob@example.com',
          customerPhone: '5551234567',
          shippingAddress: '789 Boardwalk',
          shippingCity: 'Wildwood',
          shippingState: 'NJ',
          shippingZip: '08260',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'S',
              color: 'White',
              quantity: 1,
            },
          ],
          subtotal: '31.00',
          tax: '2.64',
          total: '33.64',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 1 }]
      );

      const retrieved = await storage.getOrderByNumber(orderNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved?.orderNumber).toBe(orderNumber);
      expect(retrieved?.customerName).toBe('Bob Wilson');
    });

    it('should list all orders', async () => {
      const productName = generateTestProductName();
      const orderNumber1 = generateTestOrderNumber();
      const orderNumber2 = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For order testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);

      await storage.createOrderWithStockUpdate(
        {
          orderNumber: orderNumber1,
          customerName: 'Alice Brown',
          customerEmail: 'alice@example.com',
          customerPhone: '1112223333',
          shippingAddress: '111 Ocean Dr',
          shippingCity: 'Cape May',
          shippingState: 'NJ',
          shippingZip: '08204',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'M',
              color: 'Blue',
              quantity: 1,
            },
          ],
          subtotal: '31.00',
          tax: '2.64',
          total: '33.64',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 1 }]
      );

      await storage.createOrderWithStockUpdate(
        {
          orderNumber: orderNumber2,
          customerName: 'Charlie Davis',
          customerEmail: 'charlie@example.com',
          customerPhone: '4445556666',
          shippingAddress: '222 Sunset Blvd',
          shippingCity: 'Long Beach Island',
          shippingState: 'NJ',
          shippingZip: '08008',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'L',
              color: 'Red',
              quantity: 3,
            },
          ],
          subtotal: '93.00',
          tax: '7.91',
          total: '100.91',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 3 }]
      );

      const orders = await storage.getAllOrders();
      const testOrders = orders.filter(o => 
        o.orderNumber === orderNumber1 || o.orderNumber === orderNumber2
      );

      expect(testOrders.length).toBeGreaterThanOrEqual(2);
    });

    it('should update order status', async () => {
      const productName = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For order testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product.id);

      const order = await storage.createOrderWithStockUpdate(
        {
          orderNumber,
          customerName: 'Diana Evans',
          customerEmail: 'diana@example.com',
          customerPhone: '7778889999',
          shippingAddress: '333 Marina Way',
          shippingCity: 'Sea Isle City',
          shippingState: 'NJ',
          shippingZip: '08243',
          items: [
            {
              productId: product.id,
              name: productName,
              price: '31.00',
              size: 'M',
              color: 'Blue',
              quantity: 1,
            },
          ],
          subtotal: '31.00',
          tax: '2.64',
          total: '33.64',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [{ productId: product.id, quantity: 1 }]
      );

      const updated = await storage.updateOrderStatus(order.id, 'shipped', 'paid');

      expect(updated.status).toBe('shipped');
      expect(updated.paymentStatus).toBe('paid');
    });

    it('should handle multiple line items with combined stock updates', async () => {
      const productName1 = generateTestProductName();
      const productName2 = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product1 = await storage.createProduct({
        name: productName1,
        description: 'First test product',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 100,
      });
      testProductIds.add(product1.id);

      const product2 = await storage.createProduct({
        name: productName2,
        description: 'Second test product',
        price: '25.00',
        imageUrl: 'https://example.com/image2.jpg',
        availableSizes: ['M', 'L'],
        availableColors: ['Green', 'Yellow'],
        stockQuantity: 50,
      });
      testProductIds.add(product2.id);

      const product1InitialStock = product1.stockQuantity;
      const product2InitialStock = product2.stockQuantity;

      const order = await storage.createOrderWithStockUpdate(
        {
          orderNumber,
          customerName: 'Emily Foster',
          customerEmail: 'emily@example.com',
          customerPhone: '3334445555',
          shippingAddress: '444 Pier Ave',
          shippingCity: 'Stone Harbor',
          shippingState: 'NJ',
          shippingZip: '08247',
          items: [
            {
              productId: product1.id,
              name: productName1,
              price: '31.00',
              size: 'M',
              color: 'Blue',
              quantity: 2,
            },
            {
              productId: product2.id,
              name: productName2,
              price: '25.00',
              size: 'L',
              color: 'Green',
              quantity: 1,
            },
          ],
          subtotal: '87.00',
          tax: '7.40',
          total: '94.40',
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
        },
        [
          { productId: product1.id, quantity: 2 },
          { productId: product2.id, quantity: 1 }
        ]
      );

      expect(order.items).toHaveLength(2);
      expect(order.items[0].quantity).toBe(2);
      expect(order.items[1].quantity).toBe(1);

      // Verify both products had stock reduced
      const updatedProduct1 = await storage.getProduct(product1.id);
      const updatedProduct2 = await storage.getProduct(product2.id);

      expect(updatedProduct1?.stockQuantity).toBe(product1InitialStock - 2);
      expect(updatedProduct2?.stockQuantity).toBe(product2InitialStock - 1);
    });

    it('should reject order if insufficient stock', async () => {
      const productName = generateTestProductName();
      const orderNumber = generateTestOrderNumber();

      const product = await storage.createProduct({
        name: productName,
        description: 'For stock testing',
        price: '31.00',
        imageUrl: 'https://example.com/image.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'Blue', 'White'],
        stockQuantity: 5,
      });
      testProductIds.add(product.id);

      // Try to order 10 (more than available)
      await expect(
        storage.createOrderWithStockUpdate(
          {
            orderNumber,
            customerName: 'Frank Green',
            customerEmail: 'frank@example.com',
            customerPhone: '6667778888',
            shippingAddress: '555 Dune Rd',
            shippingCity: 'Avalon',
            shippingState: 'NJ',
            shippingZip: '08202',
            items: [
              {
                productId: product.id,
                name: productName,
                price: '31.00',
                size: 'M',
                color: 'Blue',
                quantity: 10,
              },
            ],
            subtotal: '310.00',
            tax: '26.35',
            total: '336.35',
            status: 'pending',
            paymentStatus: 'paid',
            stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 8)}`,
          },
          [{ productId: product.id, quantity: 10 }]
        )
      ).rejects.toThrow(/Insufficient stock/);

      // Verify stock was NOT reduced (transaction rolled back)
      const unchangedProduct = await storage.getProduct(product.id);
      expect(unchangedProduct?.stockQuantity).toBe(5);
    });
  });
});
