import { Hono } from "hono";
import { productsRoute } from "./routes/products";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ title: "Seduh.in API" });
});

app.route("/products", productsRoute);

export default app;
