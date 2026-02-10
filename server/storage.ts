
import { db } from "./db";
import {
  products,
  transactions,
  transactionItems,
  type Product,
  type InsertProduct,
  type Transaction,
  type CreateTransactionRequest,
  type TransactionItem
} from "@shared/schema";
import { eq, lt, sql, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Transactions
  getTransactions(): Promise<(Transaction & { items: TransactionItem[] })[]>;
  createTransaction(tx: CreateTransactionRequest): Promise<Transaction>;
  
  // Stats
  getStats(): Promise<{ dailySales: number; lowStockCount: number; pendingServices: number }>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getTransactions(): Promise<(Transaction & { items: TransactionItem[] })[]> {
    const txs = await db.select().from(transactions).orderBy(desc(transactions.date));
    
    // In a real app with many records, we'd use a join or dataloader. 
    // For MVP simplicity fetching items for list might be heavy, but fine for now.
    const result = [];
    for (const tx of txs) {
      const items = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, tx.id));
      result.push({ ...tx, items });
    }
    return result;
  }

  async createTransaction(req: CreateTransactionRequest): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      // 1. Create Transaction Header
      const totalAmount = req.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      const [newTx] = await tx.insert(transactions).values({
        customerName: req.customerName || "Cliente General",
        type: req.type,
        totalAmount: totalAmount.toString(),
        paymentStatus: req.paymentStatus || "paid",
        notes: req.notes,
      }).returning();

      // 2. Create Items and Update Stock
      for (const item of req.items) {
        await tx.insert(transactionItems).values({
          transactionId: newTx.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: (item.quantity * item.unitPrice).toString(),
          isService: item.isService || false,
        });

        // Update stock if it's a product (not service) and has a productId
        if (item.productId && !item.isService) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId)
          });

          if (product) {
            const currentStock = product.stock;
            const change = req.type === 'sale' ? -item.quantity : item.quantity;
            
            await tx.update(products)
              .set({ stock: currentStock + change })
              .where(eq(products.id, item.productId));
          }
        }
      }

      return newTx;
    });
  }

  async getStats(): Promise<{ dailySales: number; lowStockCount: number; pendingServices: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily Sales Sum
    const salesResult = await db.select({
      total: sql<string>`sum(${transactions.totalAmount})`
    })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'sale'),
      gte(transactions.date, today)
    ));
    
    const dailySales = Number(salesResult[0]?.total || 0);

    // Low Stock Count
    const lowStockResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(products)
    .where(sql`${products.stock} <= ${products.minStock}`);

    const lowStockCount = Number(lowStockResult[0]?.count || 0);

    // Pending Payments/Services
    const pendingResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(transactions)
    .where(eq(transactions.paymentStatus, 'pending'));

    const pendingServices = Number(pendingResult[0]?.count || 0);

    return { dailySales, lowStockCount, pendingServices };
  }
}

export const storage = new DatabaseStorage();
