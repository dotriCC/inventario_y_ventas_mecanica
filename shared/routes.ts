
import { z } from 'zod';
import { insertProductSchema, products, transactions, transactionItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        lowStock: z.string().optional(), // 'true' to filter low stock
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect & { items: typeof transactionItems.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions' as const,
      input: z.object({
        customerName: z.string().optional(),
        type: z.enum(['sale', 'purchase']),
        paymentStatus: z.enum(['paid', 'pending']).optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number().optional(),
          description: z.string(),
          quantity: z.number().min(1),
          unitPrice: z.number().min(0),
          isService: z.boolean().optional(),
        })).min(1),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getStats: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          dailySales: z.number(),
          lowStockCount: z.number(),
          pendingServices: z.number(),
        }),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
