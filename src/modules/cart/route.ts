import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { checkAuthorized } from "../auth/middleware";
import { AddCartItemSchema, CartItemSchema, CartSchema } from "./schema";
import { db } from "../../lib/db";
import { z } from "@hono/zod-openapi";

export const cartRoute = new OpenAPIHono();

// GET /cart
cartRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    middleware: checkAuthorized,
    responses: {
      200: {
        description: "Get cart",
        content: { "application/json": { schema: CartSchema } },
      },
      404: {
        description: "Cart not found",
      },
    },
  }),
  async (c) => {
    const user = c.get("user");

    const cart = await db.cart.findFirst({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      const newCart = await db.cart.create({
        data: { userId: user.id },
        include: { items: { include: { product: true } } },
      });
      return c.json(newCart);
    }

    return c.json(cart);
  }
);

// POST /cart/items
cartRoute.openapi(
  createRoute({
    method: "post",
    path: "/items",
    middleware: checkAuthorized,
    request: {
      body: { content: { "application/json": { schema: AddCartItemSchema } } },
    },
    responses: {
      200: {
        description: "Add item to cart",
        content: { "application/json": { schema: CartItemSchema } },
      },
      400: {
        description: "Failed to add item to cart",
      },
    },
  }),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const user = c.get("user");

      const cart = await db.cart.findFirst({
        where: { userId: user.id },
      });

      if (!cart) {
        return c.json({ message: "Cart not found" }, 400);
      }

      const existingItem = await db.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: body.productId,
        },
      });

      if (existingItem) {
        const updatedItem = await db.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + body.quantity,
          },
          include: { product: true },
        });

        return c.json(updatedItem);
      }

      const newCartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: body.productId,
          quantity: body.quantity,
        },
        include: { product: true },
      });

      return c.json(newCartItem);
    } catch (error) {
      console.log(error);
      return c.json({ message: "Failed to add item to cart" }, 400);
    }
  }
);

// DELETE /cart/items/:id
cartRoute.openapi(
  createRoute({
    method: "delete",
    path: "/items/{id}",
    responses: {
      200: { description: "Cart item deleted successfully" },
      404: { description: "Cart item not found" },
    },
  }),
  async (c) => {
    try {
      const id = c.req.param("id");

      const item = await db.cartItem.findUnique({
        where: { id: id },
      });

      if (!item) {
        return c.json({ message: "Cart item not found" }, 404);
      }

      await db.cartItem.delete({
        where: { id: id },
      });

      return c.json({
        message: `Cart item '${id}' deleted successfully`,
        deletedItem: item,
      });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to delete cart item" }, 400);
    }
  }
);
