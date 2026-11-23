import { withDatabase } from "../../../../../middlewares/database.middleware";
import { withAuthenticatedUser } from "../../../route.helpers";
import { LikeController } from "../../../../../controllers/like.controller";

export const GET = withDatabase(
  withAuthenticatedUser((request, db, user) =>
    LikeController.findLikedBlogs(
      db,
      String(user.id)
    )
  )
);