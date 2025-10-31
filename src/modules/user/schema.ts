import { z } from "@hono/zod-openapi";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UsersSchema = z.array(UserSchema);

export const UserIdParamSchem = z.object({
  id: z.string(),
});
