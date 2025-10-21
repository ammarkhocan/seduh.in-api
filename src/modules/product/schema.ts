import { z } from "@hono/zod-openapi";

export const ProductsSchema = z.array(
  z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    origin: z.string(),
    price: z.number(),
    stock: z.int(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);
