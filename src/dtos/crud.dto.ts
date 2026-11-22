import { BlogInput, CommentInput, UserInput } from "../types/crud.types";
import { ContentType, UserType } from "../types/enums";

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || isString(value);
}

function isContentType(value: unknown): value is ContentType {
  return Object.values(ContentType).includes(value as ContentType);
}

function isUserType(value: unknown): value is UserType {
  return Object.values(UserType).includes(value as UserType);
}

export function parseUserInput(
  value: unknown
): UserInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  if (
    !isString(input.name) ||
    !isString(input.username) ||
    !isString(input.email) ||
    !isString(input.externalAuthProvider) ||
    !isUserType(input.type)
  ) {
    return null;
  }

  return {
    id: isString(input.id) ? input.id : undefined,
    name: input.name,
    username: input.username,
    email: input.email,
    externalAuthProvider: input.externalAuthProvider,
    type: input.type,
    notificationsEnabled:
      typeof input.notificationsEnabled === "boolean"
        ? input.notificationsEnabled
        : undefined,
  };
}
// R-02
type ValidatedRequiredBlogFields = {
  title: string;
  content: string;
  eventStartDate: string;
  eventEndDate: string;
  publicationType: ContentType;
};

function hasRequiredBlogFields(
  input: Record<string, unknown>
): input is Record<string, unknown> & ValidatedRequiredBlogFields {
  return (
    isString(input.title) &&
    isString(input.content) &&
    isString(input.eventStartDate) &&
    isString(input.eventEndDate) &&
    isContentType(input.publicationType)
  );
}

function hasValidOptionalBlogFields(
  input: Record<string, unknown>
): boolean {
  return (
    isOptionalString(input.expirationDate) &&
    isOptionalString(input.location) &&
    isOptionalString(input.registrationUrl) &&
    isOptionalString(input.calendarId) &&
    isOptionalString(input.administratorId)
  );
}

export function parseBlogInput(
  value: unknown
): BlogInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Record<string, unknown>;

  if (
    !hasRequiredBlogFields(input) ||
    !hasValidOptionalBlogFields(input)
  ) {
    return null;
  }

  return {
    id: isString(input.id) ? input.id : undefined,
    title: input.title,
    content: input.content,
    creationDate: isString(input.creationDate)
      ? input.creationDate
      : undefined,
    expirationDate:
      input.expirationDate === null ||
      isString(input.expirationDate)
        ? input.expirationDate
        : undefined,
    isVisible:
      typeof input.isVisible === "boolean"
        ? input.isVisible
        : undefined,
    publicationType: input.publicationType,
    eventStartDate: input.eventStartDate,
    eventEndDate: input.eventEndDate,
    location:
      input.location === null || isString(input.location)
        ? input.location
        : undefined,
    registrationUrl:
      input.registrationUrl === null ||
      isString(input.registrationUrl)
        ? input.registrationUrl
        : undefined,
    imageUrls: Array.isArray(input.imageUrls)
      ? input.imageUrls.filter(isString)
      : undefined,
    calendarId:
      input.calendarId === null || isString(input.calendarId)
        ? input.calendarId
        : undefined,
    administratorId:
      input.administratorId === null ||
      isString(input.administratorId)
        ? input.administratorId
        : undefined,
  };
}

export function parseCommentInput(
  value: unknown
): CommentInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  if (
    !isString(input.content) ||
    !isString(input.authorId) ||
    !isString(input.forumId)
  ) {
    return null;
  }

  return {
    id: isString(input.id) ? input.id : undefined,
    content: input.content,
    authorId: input.authorId,
    forumId: input.forumId,
    parentCommentId:
      input.parentCommentId === null ||
      isString(input.parentCommentId)
        ? input.parentCommentId
        : undefined,
  };
}
