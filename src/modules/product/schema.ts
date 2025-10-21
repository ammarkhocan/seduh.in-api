import { z } from "@hono/zod-openapi";

export const ProductSchema = z.object({
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
});

export const ProductsSchema = z.array(ProductSchema);

export const GetProductBySlugSchema = z.object({ slug: z.string() });

export const ProductCreateSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
