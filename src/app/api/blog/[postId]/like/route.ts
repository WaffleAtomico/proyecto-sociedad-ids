import { NextRequest } from "next/server";
import { withDatabase } from "../../../../../middlewares/database.middleware";
import { withAuthenticatedUser } from "../../../route.helpers";
import { LikeController } from "../../../../../controllers/like.controller";

interface Context {
  params: Promise<{ postId: string }>;
}

export async function POST(
  request: NextRequest,
  context: Context
) {
  const { postId } = await context.params;

  return withDatabase(
    withAuthenticatedUser((currentRequest, db, user) =>
      LikeController.likeBlog(
        db,
        String(user.id),
        postId
      )
    )
  )(request);
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const { postId } = await context.params;

  return withDatabase(
    withAuthenticatedUser((currentRequest, db, user) =>
      LikeController.unlikeBlog(
        db,
        String(user.id),
        postId
      )
    )
  )(request);
}