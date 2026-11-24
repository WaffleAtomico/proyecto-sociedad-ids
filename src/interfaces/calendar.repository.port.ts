import {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { CalendarInput } from "../types/crud.types";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que CalendarService necesita de la persistencia.
 * CalendarRepository ya lo cumple por compatibilidad estructural.
 */
export interface CalendarRepositoryPort {
  create(
    db: SupabaseClient,
    calendar: Required<CalendarInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findById(
    db: SupabaseClient,
    calendarId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  update(
    db: SupabaseClient,
    calendarId: string,
    changes: Partial<CalendarInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  delete(
    db: SupabaseClient,
    calendarId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
