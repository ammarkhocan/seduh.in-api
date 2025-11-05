import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../../lib/db";
import {
  ProductBySlugSchema,
  ProductCreateSchema,
  ProductIdParamSchema,
  ProductSchema,
  ProductsSchema,
  ProductUpdateSchema,
} from "./schema";

export const productsRoute = new OpenAPIHono();

productsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
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

productsRoute.openapi(
  createRoute({
    method: "get",
    path: "/{slug}",
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

productsRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
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

productsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
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

productsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
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
