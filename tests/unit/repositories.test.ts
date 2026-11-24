import { beforeEach, describe, expect, it } from "vitest";
import { CalendarRepository } from "../../src/repositories/calendar.repository";
import { CommentRepository } from "../../src/repositories/comment.repository";
import { ForumRepository } from "../../src/repositories/forum.repository";
import { NotificationRepository } from "../../src/repositories/notification.repository";
import { UserRepository } from "../../src/repositories/user.repository";
import { databaseMock } from "../helpers/database";

const db = databaseMock as never;

describe("CalendarRepository", () => {
  beforeEach(() => databaseMock.reset());

  it("creates, finds, updates and deletes calendars", async () => {
    await CalendarRepository.create(db, {
      id: "calendar-1",
      semesterStartDate: "2026-01-01",
      semesterEndDate: "2026-06-01",
    });
    await CalendarRepository.findById(db, "calendar-1");
    await CalendarRepository.update(db, "calendar-1", {
      semesterEndDate: "2026-07-01",
    });
    await CalendarRepository.delete(db, "calendar-1");

    expect(databaseMock.calls.map((call) => [call.table, call.operation])).toEqual([
      ["Calendar", "insert"],
      ["Calendar", "select"],
      ["Calendar", "update"],
      ["Calendar", "delete"],
    ]);
    expect(databaseMock.calls[2].filters).toEqual([["id", "calendar-1"]]);
  });
});

describe("CommentRepository", () => {
  beforeEach(() => databaseMock.reset());

  it("creates, finds, updates and deletes comments", async () => {
    await CommentRepository.create(db, {
      id: "comment-1",
      content: "Hola",
      authorId: "user-1",
      forumId: "forum-1",
      parentCommentId: null,
    });
    await CommentRepository.findById(db, "comment-1");
    await CommentRepository.findByForum(db, "forum-1");
    await CommentRepository.update(db, "comment-1", {
      isHiddenByAuthor: true,
    });
    await CommentRepository.delete(db, "comment-1");

    expect(databaseMock.calls[2].filters).toEqual([
      ["forumId", "forum-1"],
      ["isHiddenByAuthor", false],
    ]);
    expect(databaseMock.calls[3].payload).toEqual({ isHiddenByAuthor: true });
  });
});

describe("ForumRepository", () => {
  beforeEach(() => databaseMock.reset());

  it("creates, finds, updates and deletes forums", async () => {
    await ForumRepository.create(db, {
      blogId: "blog-1",
      lastActivityDate: "2026-11-01T10:00:00.000Z",
    });
    await ForumRepository.create(db, {
      blogId: "blog-2",
      lastActivityDate: null as never,
    });
    await ForumRepository.findByBlogId(db, "blog-1");
    await ForumRepository.updateActivity(
      db,
      "blog-1",
      "2026-11-02T10:00:00.000Z"
    );
    await ForumRepository.delete(db, "blog-1");

    expect(databaseMock.calls[0].payload).toEqual({
      blogId: "blog-1",
      lastActivityDate: "2026-11-01T10:00:00.000Z",
    });
    expect(databaseMock.calls[3].payload).toEqual({
      lastActivityDate: "2026-11-02T10:00:00.000Z",
    });
  });
});

describe("NotificationRepository", () => {
  beforeEach(() => databaseMock.reset());

  it("creates, lists, marks and deletes notifications", async () => {
    const notification = {
      id: "notification-1",
      title: "Title",
      content: "Content",
      recipientId: "user-1",
      notificationType: "SYSTEM",
      isRead: false,
    };

    await NotificationRepository.create(db, notification);
    await NotificationRepository.createMany(db, [notification]);
    await NotificationRepository.findUnreadByRecipient(db, "user-1");
    await NotificationRepository.markAsRead(db, "notification-1");
    await NotificationRepository.delete(db, "notification-1");

    expect(databaseMock.calls[2].filters).toEqual([
      ["recipientId", "user-1"],
      ["isRead", false],
    ]);
    expect(databaseMock.calls[3].payload).toEqual({ isRead: true });
  });
});

describe("UserRepository", () => {
  beforeEach(() => databaseMock.reset());

  it("creates, finds, updates and deletes users", async () => {
    await UserRepository.create(db, {
      id: "user-1",
      name: "Taylor",
      username: "taylor",
      email: "taylor@iteso.mx",
      externalAuthProvider: "local",
      type: "REGULAR_USER" as never,
      notificationsEnabled: true,
      seed: "taylor",
    });
    await UserRepository.findById(db, "user-1");
    await UserRepository.update(db, "user-1", { username: "new" });
    await UserRepository.delete(db, "user-1");

    expect(databaseMock.calls.map((call) => call.operation)).toEqual([
      "insert",
      "select",
      "update",
      "delete",
    ]);
  });
});
