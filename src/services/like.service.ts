import { SupabaseClient } from "@supabase/supabase-js";
import { LikeRepository } from "../repositories/like.repository";

export class LikeService {
  static async likeBlog(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    const blog = await LikeRepository.findLikeableBlog(
      db,
      blogId
    );

    if (blog.error) {
      return {
        data: null,
        error: blog.error,
        notFound: false,
      };
    }

    if (!blog.data) {
      return {
        data: null,
        error: null,
        notFound: true,
      };
    }

    const result =
      await LikeRepository.createBlogLike(
        db,
        userId,
        blogId
      );

    return {
      data: result.data,
      error: result.error,
      notFound: false,
    };
  }

  static async unlikeBlog(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    return LikeRepository.deleteBlogLike(
      db,
      userId,
      blogId
    );
  }

  static async findLikedBlogs(
    db: SupabaseClient,
    userId: string
  ) {
    return LikeRepository.findLikedBlogs(
      db,
      userId
    );
  }
}