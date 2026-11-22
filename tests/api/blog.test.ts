import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import {
  GET as listPosts,
  POST as publishPost,
} from "../../src/app/api/blog/route";
import {
  GET as displayPost,
  PATCH as editPost,
  DELETE as deletePost,
} from "../../src/app/api/blog/[postId]/route";
import { POST as registerView } from "../../src/app/api/blog/[postId]/view/route";
import { POST as registerLike } from "../../src/app/api/blog/[postId]/like/route";
import { POST as hidePost } from "../../src/app/api/blog/[postId]/hide/route";
import {
  DatabaseUnavailableError,
  databaseMock,
} from "../helpers/database";
import {
  adminToken,
  apiRequest,
  params,
  readJson,
  userToken,
} from "../helpers/requests";
import { blogInput, blogRow } from "../helpers/fixtures";

const postContext = params({ postId: blogRow.id });

describe("GET /api/blog", () => {
  beforeEach(() => databaseMock.reset());

  it("lists visible posts", async () => {
    databaseMock.queue({ data: [blogRow], error: null });

    const response = await listPosts(apiRequest("/api/blog"));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: [blogRow],
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      operation: "select",
      filters: [["isVisible", true]],
      order: { column: "eventStartDate" },
    });
  });

  it("returns an empty list when there are no posts", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await listPosts(apiRequest("/api/blog"));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: [],
    });
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "db down" } });

    const response = await listPosts(apiRequest("/api/blog"));

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
      details: "db down",
    });
  });

  it("returns 500 for unexpected connection errors", async () => {
    databaseMock.failConnect(new Error("offline"));

    const response = await listPosts(apiRequest("/api/blog"));

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toMatchObject({
      error: "Internal Server Error",
    });
  });

  it("returns 503 when the database is unavailable", async () => {
    databaseMock.failConnect(new DatabaseUnavailableError());

    const response = await listPosts(apiRequest("/api/blog"));

    expect(response.status).toBe(503);
    await expect(readJson(response)).resolves.toMatchObject({
      message: "La base de datos no está disponible.",
    });
  });
});

describe("POST /api/blog", () => {
  beforeEach(() => databaseMock.reset());

  it("creates a post as an administrator", async () => {
    databaseMock.queue({ data: blogRow, error: null });

    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: adminToken(),
        body: blogInput,
      })
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: blogRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      operation: "insert",
    });
    expect(databaseMock.calls[0].payload).toMatchObject({
      title: blogInput.title,
      content: blogInput.content,
      publicationType: "BLOG",
      viewCount: 0,
      likeCount: 0,
      isVisible: true,
    });
    expect(typeof (databaseMock.calls[0].payload as { id: string }).id).toBe(
      "string"
    );
  });

  it("accepts the { blogData } wrapper", async () => {
    databaseMock.queue({ data: blogRow, error: null });

    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: adminToken(),
        body: { blogData: blogInput },
      })
    );

    expect(response.status).toBe(201);
  });

  it("returns 400 for invalid body data", async () => {
    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: adminToken(),
        body: { content: "sin título" },
      })
    );

    expect(response.status).toBe(400);
    expect(databaseMock.calls).toHaveLength(0);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: adminToken(),
        rawBody: "{{{",
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: userToken(),
        body: blogInput,
      })
    );

    expect(response.status).toBe(403);
    expect(databaseMock.calls).toHaveLength(0);
  });

  it("returns 401 without a token", async () => {
    const response = await publishPost(
      apiRequest("/api/blog", { method: "POST", body: blogInput })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue({ data: null, error: { message: "insert failed" } });

    const response = await publishPost(
      apiRequest("/api/blog", {
        method: "POST",
        token: adminToken(),
        body: blogInput,
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("GET /api/blog/:postId", () => {
  beforeEach(() => databaseMock.reset());

  it("returns a visible post", async () => {
    databaseMock.queue({ data: blogRow, error: null });

    const response = await displayPost(
      apiRequest(`/api/blog/${blogRow.id}`, { token: userToken() }),
      postContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: blogRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      filters: [
        ["id", blogRow.id],
        ["isVisible", true],
      ],
    });
  });

  it("returns 404 for a non existent post", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await displayPost(
      apiRequest("/api/blog/missing", { token: userToken() }),
      params({ postId: "missing" })
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
      message: "Post not found.",
    });
  });

  it("returns 401 without a token", async () => {
    const response = await displayPost(
      apiRequest(`/api/blog/${blogRow.id}`),
      postContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await displayPost(
      apiRequest(`/api/blog/${blogRow.id}`, { token: userToken() }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/blog/:postId", () => {
  beforeEach(() => databaseMock.reset());

  it("edits a post as an administrator", async () => {
    const updated = { ...blogRow, title: "Publicación editada" };
    databaseMock.queue({ data: updated, error: null });

    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: { ...blogInput, title: "  Publicación editada  " },
      }),
      postContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: updated,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      operation: "update",
      filters: [["id", blogRow.id]],
    });
    expect(databaseMock.calls[0].payload).toMatchObject({
      title: "Publicación editada",
      content: blogInput.content,
    });
  });

  it("returns 400 when content is empty", async () => {
    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: { ...blogInput, content: "" },
      }),
      postContext
    );

    expect(response.status).toBe(400);
    expect(databaseMock.calls).toHaveLength(0);
  });

  it("returns 400 when the body is empty", async () => {
    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: {},
      }),
      postContext
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the post does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: blogInput,
      }),
      postContext
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: userToken(),
        body: blogInput,
      }),
      postContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "update failed" } });

    const response = await editPost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: blogInput,
      }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/blog/:postId", () => {
  beforeEach(() => databaseMock.reset());

  it("deletes a post as an administrator", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await deletePost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      postContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ success: true });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      operation: "delete",
      filters: [["id", blogRow.id]],
    });
  });

  it("returns 403 for a non administrator", async () => {
    const response = await deletePost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "DELETE",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the delete fails", async () => {
    databaseMock.queue({ data: null, error: { message: "delete failed" } });

    const response = await deletePost(
      apiRequest(`/api/blog/${blogRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/blog/:postId/view", () => {
  beforeEach(() => databaseMock.reset());

  it("increments the view counter", async () => {
    databaseMock.queue(
      { data: { ...blogRow, viewCount: 2, likeCount: 4 }, error: null },
      { data: { ...blogRow, viewCount: 3, likeCount: 4 }, error: null }
    );

    const response = await registerView(
      apiRequest(`/api/blog/${blogRow.id}/view`, {
        method: "POST",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(200);
    expect(databaseMock.calls[1]).toMatchObject({
      table: "Blog",
      operation: "update",
      filters: [["id", blogRow.id]],
      payload: { viewCount: 3, likeCount: 4 },
    });
  });

  it("returns 404 for a non existent post", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await registerView(
      apiRequest(`/api/blog/missing/view`, {
        method: "POST",
        token: userToken(),
      }),
      params({ postId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await registerView(
      apiRequest(`/api/blog/${blogRow.id}/view`, { method: "POST" }),
      postContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the counter update fails", async () => {
    databaseMock.queue(
      { data: { ...blogRow, viewCount: 0 }, error: null },
      { data: null, error: { message: "counter failed" } }
    );

    const response = await registerView(
      apiRequest(`/api/blog/${blogRow.id}/view`, {
        method: "POST",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/blog/:postId/like", () => {
  beforeEach(() => databaseMock.reset());

  it("increments the like counter", async () => {
    databaseMock.queue(
      { data: { ...blogRow, viewCount: 2, likeCount: 4 }, error: null },
      { data: { ...blogRow, viewCount: 2, likeCount: 5 }, error: null }
    );

    const response = await registerLike(
      apiRequest(`/api/blog/${blogRow.id}/like`, {
        method: "POST",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(200);
    expect(databaseMock.calls[1]).toMatchObject({
      operation: "update",
      payload: { viewCount: 2, likeCount: 5 },
    });
  });

  it("returns 404 for a non existent post", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await registerLike(
      apiRequest(`/api/blog/missing/like`, {
        method: "POST",
        token: userToken(),
      }),
      params({ postId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await registerLike(
      apiRequest(`/api/blog/${blogRow.id}/like`, { method: "POST" }),
      postContext
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the first query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "read failed" } });

    const response = await registerLike(
      apiRequest(`/api/blog/${blogRow.id}/like`, {
        method: "POST",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/blog/:postId/hide", () => {
  beforeEach(() => databaseMock.reset());

  it("hides a post as an administrator", async () => {
    databaseMock.queue({
      data: { ...blogRow, isVisible: false },
      error: null,
    });

    const response = await hidePost(
      apiRequest(`/api/blog/${blogRow.id}/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      postContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      success: true,
      data: { isVisible: false },
    });
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "update",
      filters: [["id", blogRow.id]],
      payload: { isVisible: false },
    });
  });

  it("returns 404 when the post does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await hidePost(
      apiRequest(`/api/blog/missing/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      params({ postId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await hidePost(
      apiRequest(`/api/blog/${blogRow.id}/hide`, {
        method: "POST",
        token: userToken(),
      }),
      postContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "hide failed" } });

    const response = await hidePost(
      apiRequest(`/api/blog/${blogRow.id}/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      postContext
    );

    expect(response.status).toBe(500);
  });
});
