
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Products ---
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    // Basic in-memory filtering for MVP
    let filtered = products;
    if (req.query.lowStock === 'true') {
      filtered = filtered.filter(p => p.stock <= p.minStock);
    }
    res.json(filtered);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // --- Transactions ---
  app.get(api.transactions.list.path, async (req, res) => {
    const txs = await storage.getTransactions();
    res.json(txs);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction(input);
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Error creating transaction" });
      }
    }
  });

  app.get(api.transactions.getStats.path, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}

// Seed data helper
async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    console.log("Seeding database...");
    await storage.createProduct({
      name: "Aceite Sintético 5W-30",
      category: "Aceites",
      description: "Galón de aceite premium",
      stock: 12,
      minStock: 5,
      priceBuy: "25.00",
      priceSell: "45.00",
      sku: "OIL-5W30"
    });
    await storage.createProduct({
      name: "Filtro de Aceite Universal",
      category: "Filtros",
      stock: 3,
      minStock: 10, // Will trigger alert
      priceBuy: "3.50",
      priceSell: "8.00",
      sku: "FIL-UNI"
    });
    await storage.createProduct({
      name: "Pastillas de Freno Delanteras",
      category: "Frenos",
      stock: 8,
      minStock: 4,
      priceBuy: "15.00",
      priceSell: "35.00",
      sku: "BRK-FRONT"
    });
    await storage.createProduct({
      name: "Líquido de Frenos DOT4",
      category: "Líquidos",
      stock: 20,
      minStock: 5,
      priceBuy: "4.00",
      priceSell: "10.00",
      sku: "LIQ-DOT4"
    });
    console.log("Database seeded!");
  }
}

// Call seed after a short delay to ensure DB is ready
setTimeout(seedDatabase, 2000);
