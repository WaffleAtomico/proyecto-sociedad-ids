import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import { POST as publishComment } from "../../src/app/api/comments/route";
import {
  GET as displayComment,
  DELETE as deleteComment,
} from "../../src/app/api/comments/[commentId]/route";
import { POST as hideComment } from "../../src/app/api/comments/[commentId]/hide/route";
import { databaseMock } from "../helpers/database";
import {
  ADMIN_ID,
  adminToken,
  apiRequest,
  params,
  readJson,
  userToken,
} from "../helpers/requests";
import { commentRow } from "../helpers/fixtures";

const commentContext = params({ commentId: commentRow.id });

const newComment = {
  content: "Amo esta iniciativa de la Sociedad IDS.",
  forumId: commentRow.forumId,
};

describe("POST /api/comments (Publicar comentario)", () => {
  beforeEach(() => databaseMock.reset());

  it("publishes a comment with the authenticated author", async () => {
    databaseMock.queue({ data: commentRow, error: null });

    const response = await publishComment(
      apiRequest("/api/comments", {
        method: "POST",
        token: userToken(),
        body: newComment,
      })
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: commentRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Comment",
      operation: "insert",
    });
    expect(databaseMock.calls[0].payload).toMatchObject({
      content: newComment.content,
      forumId: commentRow.forumId,
    });
    expect(
      (databaseMock.calls[0].payload as { authorId: string }).authorId
    ).toBeTruthy();
  });

  it("accepts the { comment } wrapper and replies", async () => {
    const reply = {
      ...commentRow,
      parentCommentId: commentRow.id,
      content: "Totalmente de acuerdo.",
    };
    databaseMock.queue({ data: reply, error: null });

    const response = await publishComment(
      apiRequest("/api/comments", {
        method: "POST",
        token: userToken(),
        body: {
          comment: {
            content: "Totalmente de acuerdo.",
            forumId: commentRow.forumId,
            parentCommentId: commentRow.id,
          },
        },
      })
    );

    expect(response.status).toBe(201);
    expect(databaseMock.calls[0].payload).toMatchObject({
      parentCommentId: commentRow.id,
    });
  });

  it("returns 400 for invalid comment data", async () => {
    const response = await publishComment(
      apiRequest("/api/comments", {
        method: "POST",
        token: userToken(),
        body: { content: "Sin foro" },
      })
    );

    expect(response.status).toBe(400);
    expect(databaseMock.calls).toHaveLength(0);
  });

  it("returns 401 without a token", async () => {
    const response = await publishComment(
      apiRequest("/api/comments", { method: "POST", body: newComment })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue({ data: null, error: { message: "insert failed" } });

    const response = await publishComment(
      apiRequest("/api/comments", {
        method: "POST",
        token: userToken(),
        body: newComment,
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("GET /api/comments/:commentId (Ver comentario)", () => {
  beforeEach(() => databaseMock.reset());

  it("returns a visible comment", async () => {
    databaseMock.queue({ data: commentRow, error: null });

    const response = await displayComment(
      apiRequest(`/api/comments/${commentRow.id}`, { token: userToken() }),
      commentContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: commentRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Comment",
      filters: [["id", commentRow.id]],
    });
  });

  it("returns 404 when the comment does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await displayComment(
      apiRequest("/api/comments/missing", { token: userToken() }),
      params({ commentId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the comment is hidden", async () => {
    databaseMock.queue({
      data: { ...commentRow, isHiddenByAuthor: true },
      error: null,
    });

    const response = await displayComment(
      apiRequest(`/api/comments/${commentRow.id}`, { token: userToken() }),
      commentContext
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await displayComment(
      apiRequest(`/api/comments/${commentRow.id}`),
      commentContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await displayComment(
      apiRequest(`/api/comments/${commentRow.id}`, { token: userToken() }),
      commentContext
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/comments/:commentId", () => {
  beforeEach(() => databaseMock.reset());

  it("deletes a comment as an administrator", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await deleteComment(
      apiRequest(`/api/comments/${commentRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ success: true });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Comment",
      operation: "delete",
      filters: [["id", commentRow.id]],
    });
  });

  it("returns 403 for a non administrator", async () => {
    const response = await deleteComment(
      apiRequest(`/api/comments/${commentRow.id}`, {
        method: "DELETE",
        token: userToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const response = await deleteComment(
      apiRequest(`/api/comments/${commentRow.id}`, { method: "DELETE" }),
      commentContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the delete fails", async () => {
    databaseMock.queue({ data: null, error: { message: "delete failed" } });

    const response = await deleteComment(
      apiRequest(`/api/comments/${commentRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/comments/:commentId/hide (Ocultar Comentario)", () => {
  beforeEach(() => databaseMock.reset());

  it("lets the author hide their own comment", async () => {
    const auth = userToken();
    databaseMock.queue(
      { data: commentRow, error: null },
      {
        data: { ...commentRow, isHiddenByAuthor: true },
        error: null,
      }
    );

    const response = await hideComment(
      apiRequest(`/api/comments/${commentRow.id}/hide`, {
        method: "POST",
        token: auth,
      }),
      commentContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      success: true,
      data: { isHiddenByAuthor: true },
    });
    expect(databaseMock.calls[1]).toMatchObject({
      operation: "update",
      filters: [["id", commentRow.id]],
      payload: { isHiddenByAuthor: true },
    });
  });

  it("lets an administrator hide someone else's comment", async () => {
    databaseMock.queue(
      { data: commentRow, error: null },
      {
        data: { ...commentRow, isHiddenByAuthor: true },
        error: null,
      }
    );

    const response = await hideComment(
      apiRequest(`/api/comments/${commentRow.id}/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(200);
  });

  it("returns 403 when a regular user is not the author", async () => {
    databaseMock.queue({
      data: { ...commentRow, authorId: ADMIN_ID },
      error: null,
    });

    const response = await hideComment(
      apiRequest(`/api/comments/${commentRow.id}/hide`, {
        method: "POST",
        token: userToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when the comment does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await hideComment(
      apiRequest(`/api/comments/missing/hide`, {
        method: "POST",
        token: userToken(),
      }),
      params({ commentId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await hideComment(
      apiRequest(`/api/comments/${commentRow.id}/hide`, { method: "POST" }),
      commentContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the comment lookup fails", async () => {
    databaseMock.queue({ data: null, error: { message: "lookup failed" } });

    const response = await hideComment(
      apiRequest(`/api/comments/${commentRow.id}/hide`, {
        method: "POST",
        token: userToken(),
      }),
      commentContext
    );

    expect(response.status).toBe(500);
  });
});
