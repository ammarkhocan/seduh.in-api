import { Hono } from "hono";
import { productsRoute, productsDoc } from "./routes/products";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    title: "Seduh.in API",
  });
});

app.route("/products", productsRoute);

app.route("/", productsDoc);
export default app;
