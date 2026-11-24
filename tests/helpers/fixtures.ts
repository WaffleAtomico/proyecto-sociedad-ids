import { ADMIN_ID, USER_ID } from "./requests";

export const blogInput = {
  title: "Publicación de prueba",
  content: "Contenido temporal para validar el CRUD.",
  publicationType: "BLOG",
  eventStartDate: "2026-11-15T10:00:00.000Z",
  eventEndDate: "2026-11-15T12:00:00.000Z",
  expirationDate: null,
  location: "Aula de pruebas",
  registrationUrl: null,
  imageUrls: [] as string[],
  calendarId: null,
  administratorId: null,
  isVisible: true,
};

export const eventInput = {
  ...blogInput,
  title: "Hackathon Sociedad IDS 2026",
  content: "Evento de desarrollo de software y pruebas de API.",
  publicationType: "EVENT",
  eventStartDate: "2026-12-01T10:00:00Z",
  eventEndDate: "2026-12-01T18:00:00Z",
  location: "Auditorio Principal",
  administratorId: ADMIN_ID,
};

export const blogRow = {
  id: "f1415600-1696-43f4-acd0-1933908251ad",
  ...blogInput,
  creationDate: "2026-11-01T10:00:00.000Z",
  viewCount: 0,
  likeCount: 0,
};

export const eventRow = {
  id: "02a5dd33-0ff0-4249-a43e-40c154ddfc90",
  ...eventInput,
  creationDate: "2026-11-01T10:00:00.000Z",
  viewCount: 0,
  likeCount: 0,
};

export const commentRow = {
  id: "c1111111-1111-4111-8111-111111111111",
  content: "Amo esta iniciativa de la Sociedad IDS.",
  authorId: USER_ID,
  forumId: "02a5dd33-0ff0-4249-a43e-40c154ddfc90",
  parentCommentId: null,
  isHiddenByAuthor: false,
};

export const notificationRow = {
  id: "n1111111-1111-4111-8111-111111111111",
  recipientId: USER_ID,
  title: "Bienvenido a Sociedad IDS",
  content: "Tu cuenta de administrador ha sido configurada correctamente.",
  notificationType: "SYSTEM",
  isRead: false,
  notificationTime: "2026-11-01T10:00:00.000Z",
};
