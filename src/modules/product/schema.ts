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

export const ProductBySlugSchema = z.object({
  slug: z.string().openapi({ example: "product-slug" }),
});

export const ProductIdParamSchema = z.object({
  id: z.string().openapi({ example: "0DSD798SDBR7X76X23" }),
});

export const ProductCreateSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
