import { SupabaseClient } from "@supabase/supabase-js";
import { NotificationInput } from "../types/crud.types";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationRepositoryPort } from "../interfaces/notification.repository.port";

export class NotificationService {
  // R-06 (H-07): los métodos dependen del puerto; NotificationRepository es solo el valor por defecto.
  static repository: NotificationRepositoryPort = NotificationRepository;

  static async notify(
    db: SupabaseClient,
    input: NotificationInput
  ) {
    if (
      !input.title.trim() ||
      !input.content.trim() ||
      !input.recipientId
    ) {
      throw new Error(
        "Title, content and recipientId are required."
      );
    }

    return NotificationService.repository.create(db, {
      id: input.id ?? crypto.randomUUID(),
      title: input.title.trim(),
      content: input.content.trim(),
      recipientId: input.recipientId,
      notificationType:
        input.notificationType || "SYSTEM",
      isRead: input.isRead ?? false,
    });
  }

  static async displayInSystem(
    db: SupabaseClient,
    recipientId: string
  ) {
    return NotificationService.repository.findUnreadByRecipient(
      db,
      recipientId
    );
  }

  static async markAsRead(
    db: SupabaseClient,
    notificationId: string
  ) {
    return NotificationService.repository.markAsRead(
      db,
      notificationId
    );
  }
}