import { OpenAPIHono } from "@hono/zod-openapi";
import { productsRoute, productsDoc } from "./routes/products";

const app = new OpenAPIHono();

app.route("/products", productsRoute);
app.route("/", productsDoc);

export default app;
