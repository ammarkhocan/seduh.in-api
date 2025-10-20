import { Hono } from "hono";
import { db } from "../lib/db";

const productsRoute = new Hono();

// GET /products
productsRoute.get("/", async (c) => {
  const product = await db.product.findMany();
  return c.json(product);
});

// GET /products/:id
productsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const product = await db.product.findUnique({ where: { id } });

  if (!product) return c.json({ message: "Product not found sasa" }, 404);
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

export default productsRoute;
