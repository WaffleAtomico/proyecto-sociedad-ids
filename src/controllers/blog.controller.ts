import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { parseBlogInput } from "../dtos/crud.dto";
import { BlogService } from "../services/blog.service";
import {
  badRequest,
  databaseError,
  notFound,
  readBody,
} from "./controller.helpers";

export class BlogController {
  static async publishPost(request: NextRequest, db: SupabaseClient) {
    const body = await readBody<unknown>(request);
    const input = parseBlogInput(
      typeof body === "object" && body !== null && "blogData" in body
        ? (body as { blogData: unknown }).blogData
        : body
    );
    if (!input) return badRequest("Invalid blog data.");

    const result = await BlogService.publishPost(db, input);
    if (result.error) return databaseError(result.error, "Could not publish the post.");
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  }

  static async editPost(
    request: NextRequest,
    db: SupabaseClient,
    postId: string
  ) {
    const body = await readBody<unknown>(request);
    const input = parseBlogInput(body);
    if (!input) return badRequest("Invalid blog data.");

    const result = await BlogService.editPost(db, postId, input);
    if (result.error) return databaseError(result.error, "Could not edit the post.");
    if (!result.data) return notFound("Post not found.");
    return NextResponse.json({ success: true, data: result.data });
  }

  static async displayPost(
    _request: NextRequest,
    db: SupabaseClient,
    postId: string
  ) {
    const result = await BlogService.displayPost(db, postId);
    if (result.error) return databaseError(result.error, "Could not find the post.");
    if (!result.data) return notFound("Post not found.");
    return NextResponse.json({ success: true, data: result.data });
  }

  static async deletePost(
    _request: NextRequest,
    db: SupabaseClient,
    postId: string
  ) {
    const result = await BlogService.deletePost(db, postId);
    if (result.error) return databaseError(result.error, "Could not delete the post.");
    return NextResponse.json({ success: true });
  }

  static async hidePost(
    _request: NextRequest,
    db: SupabaseClient,
    postId: string
  ) {
    const result = await BlogService.hidePost(db, postId);
    if (result.error) return databaseError(result.error, "Could not hide the post.");
    if (!result.data) return notFound("Post not found.");
    return NextResponse.json({ success: true, data: result.data });
  }

  static async registerView(
    _request: NextRequest,
    db: SupabaseClient,
    postId: string
  ) {
    const result = await BlogService.registerView(db, postId);
    if (result.error) return databaseError(result.error, "Could not register the view.");
    if (!result.data) return notFound("Post not found.");
    return NextResponse.json({ success: true, data: result.data });
  }

  static async listPosts(_request: NextRequest, db: SupabaseClient) {
    const result = await BlogService.listVisiblePosts(db);
    if (result.error) return databaseError(result.error, "Could not fetch blog posts.");
    return NextResponse.json({ success: true, data: result.data ?? [] });
  }
}
