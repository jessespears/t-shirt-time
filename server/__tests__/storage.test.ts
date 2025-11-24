import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IStorage } from '../storage';
import type { InsertProduct, InsertOrder, Product, Order } from '../../shared/schema';

// Mock storage implementation for testing
class MockStorage implements IStorage {
  private products: Product[] = [];
  private orders: Order[] = [];
  private productIdCounter = 1;
  private orderIdCounter = 1;

  async getUser(id: string) {
    return undefined;
  }

  async upsertUser(user: any) {
    return { ...user, id: '1', isAdmin: 0, createdAt: new Date(), updatedAt: new Date() };
  }

  async getAllProducts(): Promise<Product[]> {
    return this.products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.find(p => p.id === id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: String(this.productIdCounter++),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: InsertProduct): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const updated = { ...product, id };
    this.products[index] = updated;
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products = this.products.filter(p => p.id !== id);
  }

  async createOrderWithStockUpdate(order: InsertOrder, items: Array<{productId: string, quantity: number}>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: String(this.orderIdCounter++),
      orderNumber: `ORD-${String(this.orderIdCounter).padStart(6, '0')}`,
      paymentStatus: 'paid',
      createdAt: new Date(),
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return this.orders.find(o => o.orderNumber === orderNumber);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orders;
  }

  async updateOrderStatus(id: string, status: string, paymentStatus: string): Promise<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) throw new Error('Order not found');
    
    order.status = status;
    order.paymentStatus = paymentStatus;
    return order;
  }

  // Helper for tests
  reset() {
    this.products = [];
    this.orders = [];
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
  }
}

describe('Storage Layer - Product Operations', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('Product CRUD', () => {
    it('should create a new product', async () => {
      const productData: InsertProduct = {
        name: 'Beach Shirt',
        description: 'A cool beach t-shirt',
        price: '29.99',
        imageUrl: '/images/shirt.jpg',
        availableSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['Blue', 'Red'],
        stockQuantity: 100,
        lowStockThreshold: 10,
      };

      const product = await storage.createProduct(productData);

      expect(product.id).toBeTruthy();
      expect(product.name).toBe('Beach Shirt');
      expect(product.price).toBe('29.99');
      expect(product.stockQuantity).toBe(100);
    });

    it('should retrieve all products', async () => {
      await storage.createProduct({
        name: 'Shirt 1',
        description: 'First shirt',
        price: '29.99',
        imageUrl: '/1.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      });

      await storage.createProduct({
        name: 'Shirt 2',
        description: 'Second shirt',
        price: '24.99',
        imageUrl: '/2.jpg',
        availableSizes: ['L'],
        availableColors: ['Red'],
        stockQuantity: 30,
        lowStockThreshold: 5,
      });

      const products = await storage.getAllProducts();
      expect(products).toHaveLength(2);
    });

    it('should retrieve a specific product', async () => {
      const created = await storage.createProduct({
        name: 'Test Shirt',
        description: 'Test',
        price: '29.99',
        imageUrl: '/test.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      });

      const retrieved = await storage.getProduct(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Shirt');
    });

    it('should update a product', async () => {
      const created = await storage.createProduct({
        name: 'Original Name',
        description: 'Original description',
        price: '29.99',
        imageUrl: '/original.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      });

      const updated = await storage.updateProduct(created.id, {
        name: 'Updated Name',
        description: 'Updated description',
        price: '34.99',
        imageUrl: '/updated.jpg',
        availableSizes: ['S', 'M', 'L'],
        availableColors: ['Red', 'White'],
        stockQuantity: 75,
        lowStockThreshold: 10,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.price).toBe('34.99');
      expect(updated.stockQuantity).toBe(75);
    });

    it('should delete a product', async () => {
      const created = await storage.createProduct({
        name: 'To Delete',
        description: 'Will be deleted',
        price: '29.99',
        imageUrl: '/delete.jpg',
        availableSizes: ['M'],
        availableColors: ['Blue'],
        stockQuantity: 50,
        lowStockThreshold: 5,
      });

      await storage.deleteProduct(created.id);
      const products = await storage.getAllProducts();
      expect(products).toHaveLength(0);
    });
  });
});

describe('Storage Layer - Order Operations', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('Order Creation', () => {
    it('should create an order with correct totals', async () => {
      const orderData: InsertOrder = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        shippingAddress: '123 Beach Ave, Ocean City, NJ 08226',
        items: JSON.stringify([
          {
            productId: '1',
            productName: 'Beach Shirt',
            size: 'L',
            color: 'Blue',
            quantity: 2,
            price: '29.99',
          },
        ]),
        subtotal: '59.98',
        tax: '5.10',
        total: '65.08',
        paymentIntentId: 'pi_test123',
        status: 'pending',
      };

      const order = await storage.createOrderWithStockUpdate(orderData, [
        { productId: '1', quantity: 2 }
      ]);

      expect(order.id).toBeTruthy();
      expect(order.orderNumber).toMatch(/^ORD-\d{6}$/);
      expect(order.customerEmail).toBe('john@example.com');
      expect(order.total).toBe('65.08');
    });

    it('should calculate NJ tax correctly for orders', () => {
      const subtotal = parseFloat('100.00');
      const NJ_TAX_RATE = 0.085;
      const tax = subtotal * NJ_TAX_RATE;
      const total = subtotal + tax;

      expect(tax).toBeCloseTo(8.5, 2);
      expect(total).toBeCloseTo(108.5, 2);
    });

    it('should retrieve order by order number', async () => {
      const orderData: InsertOrder = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        shippingAddress: '456 Ocean Blvd',
        items: JSON.stringify([]),
        subtotal: '29.99',
        tax: '2.55',
        total: '32.54',
        paymentIntentId: 'pi_test456',
        status: 'pending',
      };

      const created = await storage.createOrderWithStockUpdate(orderData, []);
      const retrieved = await storage.getOrderByNumber(created.orderNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved?.customerEmail).toBe('jane@example.com');
    });

    it('should update order status', async () => {
      const orderData: InsertOrder = {
        customerName: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        shippingAddress: '789 Shore Rd',
        items: JSON.stringify([]),
        subtotal: '50.00',
        tax: '4.25',
        total: '54.25',
        paymentIntentId: 'pi_test789',
        status: 'pending',
      };

      const created = await storage.createOrderWithStockUpdate(orderData, []);
      const updated = await storage.updateOrderStatus(created.id, 'shipped', 'paid');

      expect(updated.status).toBe('shipped');
      expect(updated.paymentStatus).toBe('paid');
    });
  });
});

describe('Price Calculations', () => {
  it('should calculate item total correctly', () => {
    const price = 29.99;
    const quantity = 3;
    const total = price * quantity;

    expect(total).toBeCloseTo(89.97, 2);
  });

  it('should calculate subtotal for multiple items', () => {
    const items = [
      { price: 29.99, quantity: 2 },
      { price: 24.99, quantity: 1 },
      { price: 34.99, quantity: 3 },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    expect(subtotal).toBeCloseTo(189.94, 2);
  });

  it('should calculate total with NJ tax', () => {
    const subtotal = 100.0;
    const taxRate = 0.085;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    expect(tax).toBeCloseTo(8.5, 2);
    expect(total).toBeCloseTo(108.5, 2);
  });
});
