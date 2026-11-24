import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que LikeService necesita de la persistencia.
 * LikeRepository ya lo cumple por compatibilidad estructural.
 */
export interface LikeRepositoryPort {
  findLikeableBlog(
    db: SupabaseClient,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  createBlogLike(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  deleteBlogLike(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findLikedBlogs(
    db: SupabaseClient,
    userId: string
  ): Promise<PostgrestResponse<DbRow>>;
}
