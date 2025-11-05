import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../../lib/db";
import { UserIdParamSchem, UserSchema, UsersSchema } from "../user/schema";

export const usersRoute = new OpenAPIHono();

// GET /users
usersRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
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
usersRoute.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
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
