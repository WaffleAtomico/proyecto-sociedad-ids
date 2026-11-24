import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import {
  CommentInput,
  CommentUpdateInput,
} from "../types/crud.types";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que CommentService necesita de la persistencia.
 * CommentRepository ya lo cumple por compatibilidad estructural.
 */
export interface CommentRepositoryPort {
  create(
    db: SupabaseClient,
    comment: Required<CommentInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findById(
    db: SupabaseClient,
    commentId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findByForum(
    db: SupabaseClient,
    forumId: string
  ): Promise<PostgrestResponse<DbRow>>;

  update(
    db: SupabaseClient,
    commentId: string,
    changes: CommentUpdateInput
  ): Promise<PostgrestSingleResponse<DbRow>>;

  delete(
    db: SupabaseClient,
    commentId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
