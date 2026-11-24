import { SupabaseClient } from "@supabase/supabase-js";
import { LikeRepository } from "../repositories/like.repository";
import { LikeRepositoryPort } from "../interfaces/like.repository.port";

export class LikeService {
  // R-06 (H-07): los métodos dependen del puerto; LikeRepository es solo el valor por defecto.
  static repository: LikeRepositoryPort = LikeRepository;

  static async likeBlog(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    const blog = await LikeService.repository.findLikeableBlog(
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
      await LikeService.repository.createBlogLike(
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
    return LikeService.repository.deleteBlogLike(
      db,
      userId,
      blogId
    );
  }

  static async findLikedBlogs(
    db: SupabaseClient,
    userId: string
  ) {
    return LikeService.repository.findLikedBlogs(
      db,
      userId
    );
  }
}