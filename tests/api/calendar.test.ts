import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import {
  GET as listEvents,
  POST as createEvent,
} from "../../src/app/api/calendar/route";
import {
  PATCH as editEvent,
  DELETE as deleteEvent,
} from "../../src/app/api/calendar/[postId]/route";
import { POST as hideEvent } from "../../src/app/api/calendar/[postId]/hide/route";
import { databaseMock } from "../helpers/database";
import {
  adminToken,
  apiRequest,
  params,
  readJson,
  userToken,
} from "../helpers/requests";
import { blogInput, eventInput, eventRow } from "../helpers/fixtures";

const eventContext = params({ postId: eventRow.id });

describe("GET /api/calendar (Listar Evento)", () => {
  beforeEach(() => databaseMock.reset());

  it("lists visible events", async () => {
    databaseMock.queue({ data: [eventRow], error: null });

    const response = await listEvents(
      apiRequest("/api/calendar", { token: userToken() })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: [eventRow],
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      filters: [
        ["isVisible", true],
        ["publicationType", "EVENT"],
      ],
    });
  });

  it("returns 401 without a token", async () => {
    const response = await listEvents(apiRequest("/api/calendar"));

    expect(response.status).toBe(401);
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await listEvents(
      apiRequest("/api/calendar", { token: userToken() })
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/calendar (Crear Evento)", () => {
  beforeEach(() => databaseMock.reset());

  it("creates an event as an administrator", async () => {
    databaseMock.queue({ data: eventRow, error: null });

    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: adminToken(),
        body: eventInput,
      })
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: eventRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Blog",
      operation: "insert",
    });
    expect(databaseMock.calls[0].payload).toMatchObject({
      title: eventInput.title,
      publicationType: "EVENT",
      location: "Auditorio Principal",
    });
  });

  it("accepts the { eventData } wrapper", async () => {
    databaseMock.queue({ data: eventRow, error: null });

    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: adminToken(),
        body: { eventData: eventInput },
      })
    );

    expect(response.status).toBe(201);
  });

  it("returns 400 when the publication is not an event", async () => {
    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: adminToken(),
        body: blogInput,
      })
    );

    expect(response.status).toBe(400);
    expect(databaseMock.calls).toHaveLength(0);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: adminToken(),
        body: { title: "Evento sin contenido" },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: userToken(),
        body: eventInput,
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue({ data: null, error: { message: "insert failed" } });

    const response = await createEvent(
      apiRequest("/api/calendar", {
        method: "POST",
        token: adminToken(),
        body: eventInput,
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/calendar/:eventId (Editar Evento)", () => {
  beforeEach(() => databaseMock.reset());

  it("edits an event as an administrator", async () => {
    const updated = { ...eventRow, title: "Hackathon actualizado" };
    databaseMock.queue({ data: updated, error: null });

    const response = await editEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: { ...eventInput, title: "  Hackathon actualizado  " },
      }),
      eventContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: updated,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "update",
      filters: [["id", eventRow.id]],
      payload: { title: "Hackathon actualizado" },
    });
  });

  it("returns 400 when the body is not an event", async () => {
    const response = await editEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: blogInput,
      }),
      eventContext
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the event does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await editEvent(
      apiRequest(`/api/calendar/missing`, {
        method: "PATCH",
        token: adminToken(),
        body: eventInput,
      }),
      params({ postId: "missing" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await editEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "PATCH",
        token: userToken(),
        body: eventInput,
      }),
      eventContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "update failed" } });

    const response = await editEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "PATCH",
        token: adminToken(),
        body: eventInput,
      }),
      eventContext
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/calendar/:eventId (Eliminar Evento)", () => {
  beforeEach(() => databaseMock.reset());

  it("deletes an event as an administrator", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await deleteEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ success: true });
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "delete",
      filters: [["id", eventRow.id]],
    });
  });

  it("returns 403 for a non administrator", async () => {
    const response = await deleteEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "DELETE",
        token: userToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the delete fails", async () => {
    databaseMock.queue({ data: null, error: { message: "delete failed" } });

    const response = await deleteEvent(
      apiRequest(`/api/calendar/${eventRow.id}`, {
        method: "DELETE",
        token: adminToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/calendar/:eventId/hide", () => {
  beforeEach(() => databaseMock.reset());

  it("hides an event as an administrator", async () => {
    databaseMock.queue({
      data: { ...eventRow, isVisible: false },
      error: null,
    });

    const response = await hideEvent(
      apiRequest(`/api/calendar/${eventRow.id}/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({
      success: true,
      data: { isVisible: false },
    });
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "update",
      payload: { isVisible: false },
    });
  });

  it("returns 403 for a non administrator", async () => {
    const response = await hideEvent(
      apiRequest(`/api/calendar/${eventRow.id}/hide`, {
        method: "POST",
        token: userToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "hide failed" } });

    const response = await hideEvent(
      apiRequest(`/api/calendar/${eventRow.id}/hide`, {
        method: "POST",
        token: adminToken(),
      }),
      eventContext
    );

    expect(response.status).toBe(500);
  });
});
