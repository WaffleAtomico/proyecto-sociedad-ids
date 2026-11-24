import { SupabaseClient } from "@supabase/supabase-js";
import {
  BlogInput,
  BlogUpdateInput,
} from "../types/crud.types";
import { ContentType } from "../types/enums";
import { BlogRepository } from "../repositories/blog.repository";
import { BlogRepositoryPort } from "../interfaces/blog.repository.port";

export class BlogService {
  // R-06 (H-07): los métodos dependen del puerto; BlogRepository es solo el valor por defecto.
  static repository: BlogRepositoryPort = BlogRepository;

  static async publishPost(
    db: SupabaseClient,
    input: BlogInput
  ) {
    if (
      !input.title?.trim() ||
      !input.content?.trim()
    ) {
      throw new Error(
        "Title and content are required."
      );
    }

    return BlogService.repository.create(db, {
      id: input.id ?? crypto.randomUUID(),
      title: input.title.trim(),
      content: input.content.trim(),
      creationDate:
        input.creationDate ??
        new Date().toISOString(),
      expirationDate:
        input.expirationDate ?? null,
      isVisible: input.isVisible ?? true,
      viewCount: 0,
      likeCount: 0,
      publicationType: input.publicationType,
      eventStartDate: input.eventStartDate,
      eventEndDate: input.eventEndDate,
      location: input.location ?? null,
      registrationUrl:
        input.registrationUrl ?? null,
      imageUrls: input.imageUrls ?? [],
      calendarId: input.calendarId ?? null,
      administratorId:
        input.administratorId ?? null,
    });
  }

  static async editPost(
    db: SupabaseClient,
    blogId: string,
    changes: BlogUpdateInput
  ) {
    if (
      changes.title !== undefined &&
      !changes.title.trim()
    ) {
      throw new Error("Title cannot be empty.");
    }

    if (
      changes.content !== undefined &&
      !changes.content.trim()
    ) {
      throw new Error("Content cannot be empty.");
    }

    return BlogService.repository.update(db, blogId, {
      ...changes,
      title: changes.title?.trim(),
      content: changes.content?.trim(),
    });
  }

  static async displayPost(
    db: SupabaseClient,
    blogId: string
  ) {
    return BlogService.repository.findById(
      db,
      blogId,
      true
    );
  }

  static async displayEvents(
    db: SupabaseClient
  ) {
    return BlogService.repository.findVisible(
      db,
      ContentType.EVENT
    );
  }

  static async hidePost(
    db: SupabaseClient,
    blogId: string
  ) {
    return BlogService.repository.setVisibility(
      db,
      blogId,
      false
    );
  }

  static async publish(
    db: SupabaseClient,
    blogId: string
  ) {
    return BlogService.repository.setVisibility(
      db,
      blogId,
      true
    );
  }

  static async deletePost(
    db: SupabaseClient,
    blogId: string
  ) {
    return BlogService.repository.delete(db, blogId);
  }

    static async registerView(
    db: SupabaseClient,
    blogId: string
  ) {
    const result =
      await BlogService.repository.findById(db, blogId);

    if (result.error || !result.data) {
      return result;
    }

    return BlogService.repository.updateViewCount(
      db,
      blogId,
      result.data.viewCount + 1
    );
  }

   static async listVisiblePosts(db: SupabaseClient) {
    return BlogService.repository.findVisible(db);
  }
}