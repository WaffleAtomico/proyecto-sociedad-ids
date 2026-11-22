import { beforeEach, describe, expect, it } from "vitest";
import { AuthService } from "../../src/services/auth.service";
import { BlogService } from "../../src/services/blog.service";
import { CalendarService } from "../../src/services/calendar.service";
import { CommentService } from "../../src/services/comment.service";
import { ForumService } from "../../src/services/forum.service";
import { NotificationService } from "../../src/services/notification.service";
import { UserService } from "../../src/services/user.service";
import { UserType } from "../../src/types/enums";
import { databaseMock } from "../helpers/database";
import { blogInput, commentRow } from "../helpers/fixtures";

const db = databaseMock as never;

describe("AuthService", () => {
  it("only grants permission to administrators", () => {
    expect(AuthService.checkPermission(null)).toBe(false);
    expect(
      AuthService.checkPermission({
        id: "1",
        email: "a@b.c",
        name: "A",
        role: UserType.REGULAR_USER,
      })
    ).toBe(false);
    expect(
      AuthService.checkPermission({
        id: "1",
        email: "a@b.c",
        name: "A",
        role: UserType.ADMINISTRATOR,
      })
    ).toBe(true);
  });
});

describe("BlogService", () => {
  beforeEach(() => databaseMock.reset());

  it("rejects posts without title or content", async () => {
    await expect(
      BlogService.publishPost(db, { ...blogInput, title: "  " } as never)
    ).rejects.toThrow("Title and content are required.");
    await expect(
      BlogService.publishPost(db, { ...blogInput, content: "" } as never)
    ).rejects.toThrow("Title and content are required.");
  });

  it("rejects empty titles or content on edit", async () => {
    await expect(
      BlogService.editPost(db, "blog-1", { title: "  " })
    ).rejects.toThrow("Title cannot be empty.");
    await expect(
      BlogService.editPost(db, "blog-1", { content: " " })
    ).rejects.toThrow("Content cannot be empty.");
  });

  it("trims editable fields", async () => {
    await BlogService.editPost(db, "blog-1", {
      title: "  New title  ",
      content: "  New content  ",
    });

    expect(databaseMock.calls[0].payload).toMatchObject({
      title: "New title",
      content: "New content",
    });
  });

  it("publishes a hidden post", async () => {
    await BlogService.publish(db, "blog-1");

    expect(databaseMock.calls[0].payload).toEqual({ isVisible: true });
  });

  it("delegates display, list and delete operations", async () => {
    await BlogService.displayPost(db, "blog-1");
    await BlogService.displayEvents(db);
    await BlogService.listVisiblePosts(db);
    await BlogService.deletePost(db, "blog-1");

    expect(databaseMock.calls[0].filters).toEqual([
      ["id", "blog-1"],
      ["isVisible", true],
    ]);
    expect(databaseMock.calls[3].operation).toBe("delete");
  });
});

describe("CalendarService", () => {
  beforeEach(() => databaseMock.reset());

  it("requires semester dates", async () => {
    await expect(
      CalendarService.create(db, {
        semesterStartDate: "",
        semesterEndDate: "",
      })
    ).rejects.toThrow("Semester dates are required.");
  });

  it("creates and delegates calendar operations", async () => {
    await CalendarService.create(db, {
      semesterStartDate: "2026-01-01",
      semesterEndDate: "2026-06-01",
    });
    await CalendarService.findById(db, "calendar-1");
    await CalendarService.update(db, "calendar-1", {
      semesterEndDate: "2026-07-01",
    });
    await CalendarService.delete(db, "calendar-1");
    await CalendarService.displayEvents(db);

    expect(databaseMock.calls.map((call) => call.table)).toEqual([
      "Calendar",
      "Calendar",
      "Calendar",
      "Calendar",
      "Blog",
    ]);
  });
});

describe("CommentService", () => {
  beforeEach(() => databaseMock.reset());

  it("rejects incomplete comments", async () => {
    await expect(
      CommentService.publishComment(db, {
        content: "",
        authorId: "user-1",
        forumId: "forum-1",
      })
    ).rejects.toThrow("Content, authorId and forumId are required.");
  });

  it("requires a parent for replies", async () => {
    await expect(
      CommentService.addReply(db, {
        content: "Hola",
        authorId: "user-1",
        forumId: "forum-1",
      })
    ).rejects.toThrow("parentCommentId is required for replies.");
  });

  it("creates a reply", async () => {
    await CommentService.addReply(db, {
      content: "Hola",
      authorId: "user-1",
      forumId: "forum-1",
      parentCommentId: "comment-0",
    });

    expect(databaseMock.calls[0].payload).toMatchObject({
      parentCommentId: "comment-0",
    });
  });

  it("finds comments by forum and updates them", async () => {
    await CommentService.findByForum(db, "forum-1");
    await CommentService.update(db, commentRow.id, { content: "Edited" });

    expect(databaseMock.calls[0].filters).toEqual([
      ["forumId", "forum-1"],
      ["isHiddenByAuthor", false],
    ]);
    expect(databaseMock.calls[1].payload).toEqual({ content: "Edited" });
  });
});

describe("ForumService", () => {
  beforeEach(() => databaseMock.reset());

  it("requires a blog id", async () => {
    await expect(
      ForumService.create(db, { blogId: "" } as never)
    ).rejects.toThrow("blogId is required.");
  });

  it("creates and delegates forum operations", async () => {
    await ForumService.create(db, { blogId: "blog-1" });
    await ForumService.findByBlogId(db, "blog-1");
    await ForumService.displayComments(db, "forum-1");
    await ForumService.updateActivity(db, "blog-1");
    await ForumService.delete(db, "blog-1");

    expect(databaseMock.calls.map((call) => [call.table, call.operation])).toEqual([
      ["Forum", "insert"],
      ["Forum", "select"],
      ["Comment", "select"],
      ["Forum", "update"],
      ["Forum", "delete"],
    ]);
  });
});

describe("NotificationService", () => {
  beforeEach(() => databaseMock.reset());

  it("rejects incomplete notifications", async () => {
    await expect(
      NotificationService.notify(db, {
        title: " ",
        content: "Content",
        recipientId: "user-1",
        notificationType: "SYSTEM",
      })
    ).rejects.toThrow("Title, content and recipientId are required.");
  });

  it("marks notifications as read", async () => {
    await NotificationService.markAsRead(db, "notification-1");

    expect(databaseMock.calls[0]).toMatchObject({
      table: "Notification",
      operation: "update",
      filters: [["id", "notification-1"]],
      payload: { isRead: true },
    });
  });
});

describe("UserService", () => {
  beforeEach(() => databaseMock.reset());

  it("rejects incomplete users", async () => {
    await expect(
      UserService.create(db, {
        name: "",
        username: "",
        email: "",
        externalAuthProvider: "local",
        type: UserType.REGULAR_USER,
      })
    ).rejects.toThrow("Name, username and email are required.");
  });

  it("creates users with normalized values", async () => {
    await UserService.create(db, {
      name: " Taylor ",
      username: " Taylor ",
      email: "TAYLOR@ITESO.MX",
      externalAuthProvider: "local",
      type: UserType.REGULAR_USER,
    });

    expect(databaseMock.calls[0].payload).toMatchObject({
      name: "Taylor",
      username: "Taylor",
      email: "taylor@iteso.mx",
      notificationsEnabled: false,
      seed: "Taylor",
    });
  });

  it("rejects an empty username on update", async () => {
    await expect(
      UserService.update(db, "user-1", { username: "  " })
    ).rejects.toThrow("Username cannot be empty.");
  });

  it("trims the updated username", async () => {
    await UserService.update(db, "user-1", { username: "  new  " });

    expect(databaseMock.calls[0].payload).toEqual({ username: "new" });
  });

  it("delegates find and delete operations", async () => {
    await UserService.findById(db, "user-1");
    await UserService.delete(db, "user-1");

    expect(databaseMock.calls[0].filters).toEqual([["id", "user-1"]]);
    expect(databaseMock.calls[1].operation).toBe("delete");
  });
});
