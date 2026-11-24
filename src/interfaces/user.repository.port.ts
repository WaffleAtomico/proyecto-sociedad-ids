import {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import {
  UserInput,
  UserUpdateInput,
} from "../types/crud.types";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que UserService necesita de la persistencia.
 * UserRepository ya lo cumple por compatibilidad estructural.
 */
export interface UserRepositoryPort {
  create(
    db: SupabaseClient,
    user: Required<UserInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findById(
    db: SupabaseClient,
    userId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;

  update(
    db: SupabaseClient,
    userId: string,
    changes: UserUpdateInput
  ): Promise<PostgrestSingleResponse<DbRow>>;

  delete(
    db: SupabaseClient,
    userId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
