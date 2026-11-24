import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import {
  BlogCreateInput,
  BlogUpdateInput,
} from "../types/crud.types";
import { ContentType } from "../types/enums";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que BlogService necesita de la persistencia.
 * Solo incluye las operaciones que BlogService realmente usa.
 * BlogRepository ya lo cumple por compatibilidad estructural de TypeScript.
 */
export interface BlogRepositoryPort {
  create(
    db: SupabaseClient,
    blog: BlogCreateInput
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findById(
    db: SupabaseClient,
    blogId: string,
    visibleOnly?: boolean
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findVisible(
    db: SupabaseClient,
    publicationType?: ContentType
  ): Promise<PostgrestResponse<DbRow>>;

  update(
    db: SupabaseClient,
    blogId: string,
    changes: BlogUpdateInput
  ): Promise<PostgrestSingleResponse<DbRow>>;

  setVisibility(
    db: SupabaseClient,
    blogId: string,
    isVisible: boolean
  ): Promise<PostgrestSingleResponse<DbRow>>;

  delete(
    db: SupabaseClient,
    blogId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  updateViewCount(
    db: SupabaseClient,
    blogId: string,
    viewCount: number
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
