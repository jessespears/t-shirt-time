import {
  users,
  products,
  orders,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: InsertProduct): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Order operations
  createOrderWithStockUpdate(order: InsertOrder, items: Array<{productId: string, quantity: number}>): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string, paymentStatus: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.email) {
      throw new Error("Email is required for user upsert");
    }

    // Check for existing user by email first (since email has unique constraint)
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email));
    
    if (existingByEmail) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          id: userData.id!, // Update ID in case it changed
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      return user;
    } else {
      // Insert new user
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          isAdmin: 0,
        })
        .returning();
      return user;
    }
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Order operations
  async createOrderWithStockUpdate(orderData: InsertOrder, items: Array<{productId: string, quantity: number}>): Promise<Order> {
    return await db.transaction(async (tx) => {
      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
        }

        await tx
          .update(products)
          .set({
            stockQuantity: product.stockQuantity - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
      
      const [order] = await tx.insert(orders).values(orderData).returning();
      return order;
    });
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async updateOrderStatus(id: string, status: string, paymentStatus: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        status,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();
