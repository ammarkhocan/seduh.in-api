import { Hono } from "hono";
import { db } from "./lib/db";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    title: "Seduh.in API",
  });
});

app.get("/products", async (c) => {
  const products = await db.product.findMany();

  return c.json(products);
});

export default app;
