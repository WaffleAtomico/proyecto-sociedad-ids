import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { LikeService } from "../services/like.service";
import {
  databaseError,
  notFound,
} from "./controller.helpers";

export class LikeController {
  static async likeBlog(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    const result = await LikeService.likeBlog(
      db,
      userId,
      blogId
    );

    // Hidden or expired posts are treated as non-existing.
    if (result.notFound) {
      return notFound("Post not found.");
    }

    if (result.error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "Ya diste like a esta publicación.",
        },
        { status: 409 }
      );
    }

    if (result.error?.code === "23503") {
      return notFound("Post not found.");
    }

    if (result.error) {
      return databaseError(
        result.error,
        "Could not register the like."
      );
    }

    return NextResponse.json({
      success: true,
      liked: true,
      data: result.data,
    });
  }

  static async unlikeBlog(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    const result = await LikeService.unlikeBlog(
      db,
      userId,
      blogId
    );

    if (result.error) {
      return databaseError(
        result.error,
        "Could not remove the like."
      );
    }

    return NextResponse.json({
      success: true,
      liked: false,
      removed: result.data !== null,
    });
  }

  static async findLikedBlogs(
    db: SupabaseClient,
    userId: string
  ) {
    const result = await LikeService.findLikedBlogs(
      db,
      userId
    );

    if (result.error) {
      return databaseError(
        result.error,
        "Could not retrieve liked posts."
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  }
}