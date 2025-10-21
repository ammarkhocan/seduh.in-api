import { OpenAPIHono } from "@hono/zod-openapi";
import { app as productsApp, productsRoute } from "./routes/products";

const mainApp = new OpenAPIHono();

mainApp.route("/", productsApp);

mainApp.route("/products", productsRoute);

export default mainApp;
