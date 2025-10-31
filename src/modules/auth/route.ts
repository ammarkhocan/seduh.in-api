import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { db } from "../../lib/db";
import {
  LoginUserScema,
  PrivateUserSchema,
  RegisterUserScema,
  TokenSchema,
  UserSchema,
} from "../user/schema";
import { signToken } from "../../lib/token";
import { checkAuthorized } from "../auth/middleware";

export const authRoute = new OpenAPIHono();

// POST auth/register
authRoute.openapi(
  createRoute({
    method: "post",
    path: "/register",
    request: {
      body: { content: { "application/json": { schema: RegisterUserScema } } },
    },
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
authRoute.openapi(
  createRoute({
    method: "post",
    path: "/login",
    request: {
      body: { content: { "application/json": { schema: LoginUserScema } } },
    },
    responses: {
      200: {
        description: "Logged in user",
        content: { "text/plain": { schema: TokenSchema } },
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

      const isMatch = await Bun.password.verify(
        body.password,
        user.password?.hash
      );

      if (!isMatch) {
        return c.json({
          message: "Password incorect",
        });
      }

      const token = await signToken(user.id);

      return c.text(token);
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
authRoute.openapi(
  createRoute({
    method: "get",
    path: "/me",
    middleware: checkAuthorized,
    responses: {
      200: {
        description: "Get authenticated user",
        content: { "application/json": { schema: PrivateUserSchema } },
      },
      404: {
        description: "User by id not found",
      },
    },
  }),
  async (c) => {
    const user = c.get("user");

    return c.json(user);
  }
);
