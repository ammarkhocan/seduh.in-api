import { OpenAPIHono } from "@hono/zod-openapi";
import { productsRoute } from "./modules/product/route";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { usersRoute } from "./modules/user/route";
import { authRoute } from "./modules/auth/route";

const app = new OpenAPIHono();

app.use(cors());

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

app.route("/products", productsRoute);
app.route("/users", usersRoute);
app.route("/auth", authRoute);

export default app;
