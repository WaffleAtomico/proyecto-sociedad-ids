import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import { ForumController } from "../../src/controllers/forum.controller";
import { databaseMock } from "../helpers/database";
import { apiRequest, readJson } from "../helpers/requests";
import { commentRow } from "../helpers/fixtures";

const db = databaseMock as never;

describe("ForumController.displayComments", () => {
  beforeEach(() => databaseMock.reset());

  it("requires a forumId", async () => {
    const response = await ForumController.displayComments(
      apiRequest("/api/forum"),
      db
    );

    expect(response.status).toBe(400);
  });

  it("lists comments for a forum", async () => {
    databaseMock.queue({ data: [commentRow], error: null });

    const response = await ForumController.displayComments(
      apiRequest("/api/forum", { searchParams: { forumId: "forum-1" } }),
      db
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: [commentRow],
    });
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await ForumController.displayComments(
      apiRequest("/api/forum", { searchParams: { forumId: "forum-1" } }),
      db
    );

    expect(response.status).toBe(500);
  });
});

describe("ForumController.addComment", () => {
  beforeEach(() => databaseMock.reset());

  it("adds a comment", async () => {
    databaseMock.queue({ data: commentRow, error: null });

    const response = await ForumController.addComment(
      apiRequest("/api/forum", {
        method: "POST",
        body: {
          comment: {
            content: commentRow.content,
            authorId: commentRow.authorId,
            forumId: commentRow.forumId,
          },
        },
      }),
      db
    );

    expect(response.status).toBe(201);
  });

  it("returns 400 for invalid comments", async () => {
    const response = await ForumController.addComment(
      apiRequest("/api/forum", { method: "POST", body: {} }),
      db
    );

    expect(response.status).toBe(400);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue({ data: null, error: { message: "insert failed" } });

    const response = await ForumController.addComment(
      apiRequest("/api/forum", {
        method: "POST",
        body: {
          content: "Hola",
          authorId: "user-1",
          forumId: "forum-1",
        },
      }),
      db
    );

    expect(response.status).toBe(500);
  });
});
