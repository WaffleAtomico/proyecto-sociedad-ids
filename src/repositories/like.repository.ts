import { SupabaseClient } from "@supabase/supabase-js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class LikeRepository {
  /**
   * A blog can be liked only while it is visible and not expired.
   */
  static async findLikeableBlog(
    db: SupabaseClient,
    blogId: string
  ) {
    return db
      .from("Blog")
      .select("id")
      .eq("id", blogId)
      .eq("isVisible", true)
      .or(
        `expirationDate.is.null,expirationDate.gte.${today()}`
      )
      .maybeSingle();
  }

  static async createBlogLike(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    return db
      .from("Like")
      .insert({
        userId,
        blogId,
      })
      .select("id, userId, blogId, createdAt")
      .single();
  }

  static async deleteBlogLike(
    db: SupabaseClient,
    userId: string,
    blogId: string
  ) {
    return db
      .from("Like")
      .delete()
      .eq("userId", userId)
      .eq("blogId", blogId)
      .select("id")
      .maybeSingle();
  }

  static async findLikedBlogs(
    db: SupabaseClient,
    userId: string
  ) {
    return db
      .from("Like")
      .select("blogId, createdAt, Blog!inner(*)")
      .eq("userId", userId)
      .not("blogId", "is", null)
      .eq("Blog.isVisible", true)
      .or(
        `expirationDate.is.null,expirationDate.gte.${today()}`,
        { foreignTable: "Blog" }
      )
      .order("createdAt", {
        ascending: false,
      });
  }
}