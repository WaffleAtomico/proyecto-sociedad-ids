import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { NotificationInput } from "../types/crud.types";
import { DbRow } from "./db.row";

/**
 * R-06 (H-07): contrato que NotificationService necesita de la persistencia.
 * No incluye createMany ni delete porque el servicio no los usa.
 */
export interface NotificationRepositoryPort {
  create(
    db: SupabaseClient,
    notification: Required<NotificationInput>
  ): Promise<PostgrestSingleResponse<DbRow>>;

  findUnreadByRecipient(
    db: SupabaseClient,
    recipientId: string
  ): Promise<PostgrestResponse<DbRow>>;

  markAsRead(
    db: SupabaseClient,
    notificationId: string
  ): Promise<PostgrestSingleResponse<DbRow>>;
}
