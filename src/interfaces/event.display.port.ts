import {
  PostgrestResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): operación de BlogService que CalendarService necesita
 * (consultar eventos). BlogService ya lo cumple estructuralmente.
 */
export interface EventDisplayPort {
  displayEvents(
    db: SupabaseClient
  ): Promise<PostgrestResponse<DbRow>>;
}
