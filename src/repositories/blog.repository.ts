import { SupabaseClient } from "@supabase/supabase-js";
import {
  BlogCreateInput,
  BlogUpdateInput,
} from "../types/crud.types";
import { ContentType } from "../types/enums";

export class BlogRepository {
  static async create(
    db: SupabaseClient,
    blog: BlogCreateInput
  ) {
    return db
      .from("Blog")
      .insert(blog)
      .select()
      .single();
  }

  static async findById(
    db: SupabaseClient,
    blogId: string,
    visibleOnly = false
  ) {
    let query = db
      .from("Blog")
      .select("*")
      .eq("id", blogId);

    if (visibleOnly) {
      query = query.eq("isVisible", true);
    }

    return query.maybeSingle();
  }

  static async findVisible(
    db: SupabaseClient,
    publicationType?: ContentType
  ) {
    let query = db
      .from("Blog")
      .select("*")
      .eq("isVisible", true);

    if (publicationType) {
      query = query.eq(
        "publicationType",
        publicationType
      );
    }

    return query.order("eventStartDate", {
      ascending: true,
    });
  }

  static async update(
    db: SupabaseClient,
    blogId: string,
    changes: BlogUpdateInput
  ) {
    return db
      .from("Blog")
      .update(changes)
      .eq("id", blogId)
      .select()
      .single();
  }

  static async setVisibility(
    db: SupabaseClient,
    blogId: string,
    isVisible: boolean
  ) {
    return db
      .from("Blog")
      .update({ isVisible })
      .eq("id", blogId)
      .select()
      .single();
  }

  static async delete(
    db: SupabaseClient,
    blogId: string
  ) {
    return db
      .from("Blog")
      .delete()
      .eq("id", blogId);
  }

    static async updateViewCount(
    db: SupabaseClient,
    blogId: string,
    viewCount: number
  ) {
    return db
      .from("Blog")
      .update({ viewCount })
      .eq("id", blogId)
      .select()
      .single();
  }
}