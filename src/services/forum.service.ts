import { SupabaseClient } from "@supabase/supabase-js";
import { ForumInput } from "../types/crud.types";
import { ForumRepository } from "../repositories/forum.repository";
import { ForumRepositoryPort } from "../interfaces/forum.repository.port";
import { CommentService } from "./comment.service";
import { ForumCommentsPort } from "../interfaces/forum.comments.port";

export class ForumService {
  // R-06 (H-07): los métodos dependen del puerto; ForumRepository es solo el valor por defecto.
  static repository: ForumRepositoryPort = ForumRepository;
  static comments: ForumCommentsPort = CommentService;

  static async create(
    db: SupabaseClient,
    input: ForumInput
  ) {
    if (!input.blogId) {
      throw new Error("blogId is required.");
    }

    return ForumService.repository.create(db, {
      blogId: input.blogId,
      lastActivityDate:
        input.lastActivityDate ?? null,
    });
  }

  static async findByBlogId(
    db: SupabaseClient,
    blogId: string
  ) {
    return ForumService.repository.findByBlogId(db, blogId);
  }

  static async displayComments(
    db: SupabaseClient,
    forumId: string
  ) {
    return ForumService.comments.findByForum(db, forumId);
  }

  static async updateActivity(
    db: SupabaseClient,
    blogId: string
  ) {
    return ForumService.repository.updateActivity(
      db,
      blogId,
      new Date().toISOString()
    );
  }

  static async delete(
    db: SupabaseClient,
    blogId: string
  ) {
    return ForumService.repository.delete(db, blogId);
  }
}