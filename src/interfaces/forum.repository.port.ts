import {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { ForumInput } from "../types/crud.types";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que ForumService necesita de la persistencia.
 * ForumRepository ya lo cumple por compatibilidad estructural.
 */
export interface ForumRepositoryPort {
  create(
    db: SupabaseClient,
    forum: Required<ForumInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findByBlogId(
    db: SupabaseClient,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  updateActivity(
    db: SupabaseClient,
    blogId: string,
    lastActivityDate: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  delete(
    db: SupabaseClient,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
