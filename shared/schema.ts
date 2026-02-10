
import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === PRODUCTOS / INVENTARIO ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // aceites, filtros, frenos, etc.
  description: text("description"),
  sku: text("sku"), // Código opcional
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5), // Alerta
  priceBuy: numeric("price_buy").notNull(),
  priceSell: numeric("price_sell").notNull(),
});

// === TRANSACCIONES (VENTAS / COMPRAS / SERVICIOS) ===
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").default("Cliente General"),
  type: text("type").notNull(), // 'sale' (venta), 'purchase' (compra/ingreso stock)
  date: timestamp("date").defaultNow(),
  totalAmount: numeric("total_amount").notNull(),
  paymentStatus: text("payment_status").default("paid"), // paid, pending
  notes: text("notes"), // Para notas de servicio o detalles del vehículo
});

// === ITEMS DE LA TRANSACCIÓN ===
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  productId: integer("product_id"), // Null si es solo Mano de Obra manual
  description: text("description").notNull(), // Nombre del producto o "Mano de Obra"
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  subtotal: numeric("subtotal").notNull(),
  isService: boolean("is_service").default(false), // True si es mano de obra
});

// === RELATIONS ===
export const transactionRelations = relations(transactions, ({ many }) => ({
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({ id: true });

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;

// Tipos compuestos para la API
export type CreateTransactionRequest = {
  customerName?: string;
  type: 'sale' | 'purchase';
  paymentStatus?: 'paid' | 'pending';
  notes?: string;
  items: {
    productId?: number;
    description: string;
    quantity: number;
    unitPrice: number; // Enviado como número, convertido a string para DB
    isService?: boolean;
  }[];
};
