import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { db } from "../lib/db";
import { ProductsSchema } from "../modules/product/schema";

export const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: "get",
    path: "/products",
    responses: {
      200: {
        description: "Get all products",
        content: { "application/json": { schema: ProductsSchema } },
      },
    },
  }),
  async (c) => {
    const products = await db.product.findMany();
    return c.json(products);
  }
);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Seduh.in API",
    version: "1.0.0",
  },
});

app.get(
  "/",
  Scalar({
    pageTitle: "Seduh.in API",
    url: "/openapi.json",
  })
);

export const productsRoute = new OpenAPIHono();

// GET /products
productsRoute.get("/", async (c) => {
  const product = await db.product.findMany();
  return c.json(product);
});

// GET /products/:slug
productsRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const product = await db.product.findUnique({ where: { slug } });

  if (!product) {
    return c.json({ message: "Product not found" }, 404);
  }

  return c.json(product);
});

// POST /products
productsRoute.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.name || !body.price || !body.stock || !body.origin || !body.imageUrl || !body.description) {
    return c.json({ message: "Missing required fields" }, 400);
  }

  const newProduct = await db.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      imageUrl: body.imageUrl,
      origin: body.origin,
      price: body.price,
      stock: body.stock,
      description: body.description,
    },
  });
  return c.json(newProduct, 201);
});

// PUT /products/:id
productsRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    const updated = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
        origin: body.origin,
        price: body.price,
        stock: body.stock,
        description: body.description,
      },
    });
    return c.json(updated);
  } catch {
    return c.json({ message: "Product not found" }, 404);
  }
});

// PATCH /products/:id
productsRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    const updated = await db.product.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
        origin: body.origin ?? undefined,
        price: body.price ?? undefined,
        stock: body.stock ?? undefined,
        description: body.description ?? undefined,
      },
    });
    return c.json(updated);
  } catch {
    return c.json({ message: "Product not found" }, 404);
  }
});

// DELETE /products/:id
productsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.product.delete({ where: { id } });
    return c.json({ message: "Product deleted successfully" });
  } catch {
    return c.json({ message: "Product not found" }, 404);
  }
});
