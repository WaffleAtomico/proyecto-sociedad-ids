import {
  PostgrestResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): operación de CommentService que ForumService necesita
 * (listar comentarios de un foro). CommentService ya lo cumple estructuralmente.
 */
export interface ForumCommentsPort {
  findByForum(
    db: SupabaseClient,
    forumId: string
  ): Promise<PostgrestResponse<DbRow>>;
}
