import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { db } from "../lib/db";
import {
  ProductBySlugSchema,
  ProductCreateSchema,
  ProductIdParamSchema,
  ProductSchema,
  ProductsSchema,
  ProductUpdateSchema,
} from "../modules/product/schema";
import { cors } from "hono/cors";
import {
  LoginUserScema,
  RegisterUserScema,
  TokenSchema,
  UserIdParamSchem,
  UserSchema,
  UsersSchema,
} from "../modules/user/schema";
import { hash, password } from "bun";
import { use } from "hono/jsx";
import { sign, verify, decode } from "hono/jwt";

export const app = new OpenAPIHono();

app.use(cors());

// GET /users
app.openapi(
  createRoute({
    method: "get",
    path: "/users",
    responses: {
      200: {
        description: "Get all users",
        content: { "application/json": { schema: UsersSchema } },
      },
    },
  }),
  async (c) => {
    const users = await db.user.findMany({
      omit: {
        email: true,
      },
    });
    return c.json(users);
  }
);

// GET users/{id}
app.openapi(
  createRoute({
    method: "get",
    path: "/users/{id}",
    request: { params: UserIdParamSchem },
    responses: {
      200: {
        description: "Get one user by ID",
        content: { "application/json": { schema: UserSchema } },
      },
      404: {
        description: "User by id not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const user = await db.user.findUnique({
      where: { id },
      omit: {
        email: true,
      },
    });

    if (!user) {
      return c.notFound();
    }

    return c.json(user);
  }
);

// POST auth/register
app.openapi(
  createRoute({
    method: "post",
    path: "/auth/register",
    request: { body: { content: { "application/json": { schema: RegisterUserScema } } } },
    responses: {
      201: {
        description: "Register new users",
        content: { "application/json": { schema: UserSchema } },
      },
      400: {
        description: "Failed ro register new user",
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");

    try {
      const hash = await Bun.password.hash(body.password);

      const users = await db.user.create({
        data: {
          username: body.username,
          email: body.email,
          fullName: body.fullName,
          password: { create: { hash } },
        },
      });
      return c.json(users, 201);
    } catch (error) {
      return c.json(
        {
          message: "Username or email already exist",
        },
        400
      );
    }
  }
);

// POST auth/login
app.openapi(
  createRoute({
    method: "post",
    path: "/auth/login",
    request: { body: { content: { "application/json": { schema: LoginUserScema } } } },
    responses: {
      200: {
        description: "Logged in user",
        content: { "application/json": { schema: TokenSchema } },
      },
      400: {
        description: "Failed to login user",
      },
      404: {
        description: "User not found",
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");

    try {
      const user = await db.user.findUnique({
        where: { email: body.email },
        include: {
          password: true,
        },
      });

      if (!user) {
        return c.notFound();
      }

      if (!user.password?.hash) {
        return c.json({
          message: "User has no password",
        });
      }

      const isMatch = await Bun.password.verify(body.password, user.password?.hash);

      if (!isMatch) {
        return c.json({
          message: "Password incorect",
        });
      }

      const payload = {
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 5, // Expires in 5 minutes
      };

      const tokenSecretKey = String(process.env.TOKEN_SECRET_KEY);

      const token = await sign(payload, tokenSecretKey);
      // console.log({ user, isMatch });

      // const token = "..";
      // Todo
      return c.json(token);
    } catch (error) {
      return c.json(
        {
          message: "Email or password in correct",
        },
        400
      );
    }
  }
);
// GET auth/me

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

app.openapi(
  createRoute({
    method: "get",
    path: "/products/{slug}",
    request: { params: ProductBySlugSchema },
    responses: {
      200: {
        description: "Get on product by slug",
        content: { "application/json": { schema: ProductSchema } },
      },
      404: {
        description: "product by slug not found",
      },
    },
  }),
  async (c) => {
    const { slug } = c.req.valid("param");

    const product = await db.product.findUnique({ where: { slug } });

    if (!product) {
      return c.notFound();
    }
    return c.json(product);
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

app.openapi(
  createRoute({
    method: "post",
    path: "/products",
    request: {
      body: {
        content: { "application/json": { schema: ProductCreateSchema } },
      },
    },
    responses: {
      201: {
        description: "Product created successfully",
        content: { "application/json": { schema: ProductSchema } },
      },
      400: { description: "Invalid request" },
    },
  }),
  async (c) => {
    try {
      const data = await c.req.valid("json");
      const newProduct = await db.product.create({ data });
      return c.json(newProduct, 201);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to create product" }, 400);
    }
  }
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/products/{id}",
    request: { params: ProductIdParamSchema },
    responses: {
      200: { description: "Product deleted successfully" },
      404: { description: "Product not found" },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid("param");

      const product = await db.product.findUnique({ where: { id } });

      if (!product) {
        return c.json({ message: "Product not found" }, 404);
      }

      await db.product.delete({ where: { id } });

      return c.json({
        message: `Product with id '${id}' deleted successfully`,
        deletedProduct: product,
      });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to delete product" }, 400);
    }
  }
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/products/{id}",
    request: {
      params: ProductIdParamSchema,
      body: {
        content: { "application/json": { schema: ProductUpdateSchema } },
      },
    },
    responses: {
      200: {
        description: "Product updated successfully",
        content: {
          "application/json": {
            schema: ProductSchema,
          },
        },
      },
      404: {
        description: "Product not found",
      },
      400: {
        description: "Invalid request body",
      },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const data = await c.req.valid("json");

      const product = await db.product.findUnique({ where: { id } });
      if (!product) {
        return c.json({ message: "Product not found" }, 404);
      }

      const updatedProduct = await db.product.update({
        where: { id },
        data,
      });

      return c.json({
        message: `Product with id '${id}' updated successfully`,
        updatedProduct,
      });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to update product" }, 400);
    }
  }
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
