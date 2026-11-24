import { describe, expect, it } from "vitest";
import {
  parseBlogInput,
  parseCommentInput,
  parseUserInput,
} from "../../src/dtos/crud.dto";

const validBlog = {
  title: "Title",
  content: "Content",
  publicationType: "BLOG",
  eventStartDate: "2026-11-15T10:00:00.000Z",
  eventEndDate: "2026-11-15T12:00:00.000Z",
};

describe("parseBlogInput", () => {
  it("parses a valid blog input with all optional fields", () => {
    expect(
      parseBlogInput({
        ...validBlog,
        id: "post-1",
        creationDate: "2026-11-01T10:00:00.000Z",
        expirationDate: null,
        isVisible: false,
        location: "Aula",
        registrationUrl: "https://iteso.mx",
        imageUrls: ["https://iteso.mx/a.png", ""],
        calendarId: "calendar-1",
        administratorId: "admin-1",
      })
    ).toMatchObject({
      id: "post-1",
      title: "Title",
      isVisible: false,
      location: "Aula",
      imageUrls: ["https://iteso.mx/a.png"],
      calendarId: "calendar-1",
    });
  });

  it("rejects missing required fields", () => {
    expect(parseBlogInput(null)).toBeNull();
    expect(parseBlogInput("string")).toBeNull();
    expect(parseBlogInput({ title: "Title" })).toBeNull();
    expect(
      parseBlogInput({ ...validBlog, publicationType: "UNKNOWN" })
    ).toBeNull();
  });

  it("rejects invalid optional field types", () => {
    expect(parseBlogInput({ ...validBlog, location: 42 })).toBeNull();
    expect(
      parseBlogInput({ ...validBlog, expirationDate: false })
    ).toBeNull();
    expect(
      parseBlogInput({ ...validBlog, registrationUrl: 10 })
    ).toBeNull();
    expect(parseBlogInput({ ...validBlog, calendarId: 10 })).toBeNull();
    expect(
      parseBlogInput({ ...validBlog, administratorId: 10 })
    ).toBeNull();
  });
});

describe("parseCommentInput", () => {
  it("parses a valid comment", () => {
    expect(
      parseCommentInput({
        content: "Hola",
        authorId: "user-1",
        forumId: "forum-1",
        parentCommentId: null,
      })
    ).toEqual({
      id: undefined,
      content: "Hola",
      authorId: "user-1",
      forumId: "forum-1",
      parentCommentId: null,
    });
  });

  it("rejects invalid comments", () => {
    expect(parseCommentInput(undefined)).toBeNull();
    expect(parseCommentInput({ content: "Hola" })).toBeNull();
    expect(
      parseCommentInput({
        content: "Hola",
        authorId: "user-1",
        forumId: "forum-1",
        parentCommentId: 123,
      })
    ).toMatchObject({ parentCommentId: undefined });
  });
});

describe("parseUserInput", () => {
  it("parses a valid user", () => {
    expect(
      parseUserInput({
        name: "Taylor",
        username: "taylor",
        email: "taylor@iteso.mx",
        externalAuthProvider: "local",
        type: "REGULAR_USER",
        notificationsEnabled: true,
      })
    ).toMatchObject({
      name: "Taylor",
      type: "REGULAR_USER",
      notificationsEnabled: true,
    });
  });

  it("rejects invalid users", () => {
    expect(parseUserInput(null)).toBeNull();
    expect(
      parseUserInput({
        name: "Taylor",
        username: "taylor",
        email: "taylor@iteso.mx",
        externalAuthProvider: "local",
        type: "STUDENT",
      })
    ).toBeNull();
  });
});
