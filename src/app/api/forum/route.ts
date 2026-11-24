import { NextRequest, NextResponse } from "next/server";
import { withDatabase } from "../../../middlewares/database.middleware";
import { authenticateRequest } from "../../../middlewares/auth.middleware";
import { CommentRepository } from "../../../repositories/comment.repository";

const GENERAL_FORUM_TITLE = "__RACOODE_GENERAL_FORUM__";

async function ensureGeneralForumId(db: any): Promise<string | null> {
  const { data: existingForums } = await db
    .from("Forum")
    .select("blogId")
    .limit(1);

  if (
    Array.isArray(existingForums) &&
    existingForums.length > 0 &&
    existingForums[0]?.blogId
  ) {
    return String(existingForums[0].blogId);
  }

  const blogId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error: blogErr } = await db.from("Blog").insert({
    id: blogId,
    title: GENERAL_FORUM_TITLE,
    content: "Foro general de la comunidad Racoode",
    creationDate: now,
    isVisible: false,
    publicationType: "BLOG",
    eventStartDate: now,
    eventEndDate: now,
  });

  if (blogErr) return null;

  const { error: forumErr } = await db.from("Forum").insert({
    blogId,
    lastActivityDate: now,
  });

  if (forumErr) return null;

  return blogId;
}

async function resolveAuthenticatedUserId(
  request: NextRequest,
  db: any,
  body?: any
): Promise<{ userId: string } | { error: string; status: number }> {
  // 1. JWT propio del backend
  const localAuth = authenticateRequest(request);
  if (localAuth.authenticated && localAuth.user?.id) {
    return { userId: String(localAuth.user.id) };
  }

  // 2. Token de sesión de Supabase Auth
  const authHeader = request.headers.get("authorization");
  const rawToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : request.cookies.get("token")?.value || null;

  if (rawToken && rawToken !== "undefined" && rawToken !== "null") {
    const { data: supaAuth, error: supaErr } = await db.auth.getUser(rawToken);
    if (!supaErr && supaAuth?.user) {
      const supaUser = supaAuth.user;

      const { data: dbUserById } = await db
        .from("User")
        .select("id")
        .eq("id", supaUser.id)
        .maybeSingle();

      if (dbUserById?.id) {
        return { userId: String(dbUserById.id) };
      }

      if (supaUser.email) {
        const { data: dbUserByEmail } = await db
          .from("User")
          .select("id")
          .eq("email", supaUser.email)
          .maybeSingle();

        if (dbUserByEmail?.id) {
          return { userId: String(dbUserByEmail.id) };
        }
      }
    }
  }

  // 3. Respaldo por ID o email validado en la tabla User
  const candidateId = body?.authorId ? String(body.authorId).trim() : "";
  const candidateEmail = body?.authorEmail ? String(body.authorEmail).trim() : "";

  if (candidateId) {
    const { data: userRow } = await db
      .from("User")
      .select("id")
      .eq("id", candidateId)
      .maybeSingle();
    if (userRow?.id) {
      return { userId: String(userRow.id) };
    }
  }

  if (candidateEmail) {
    const { data: userRow } = await db
      .from("User")
      .select("id")
      .eq("email", candidateEmail)
      .maybeSingle();
    if (userRow?.id) {
      return { userId: String(userRow.id) };
    }
  }

  return {
    error: "Debes iniciar sesión con una cuenta válida para realizar esta acción.",
    status: 401,
  };
}

export const GET = withDatabase(async (request: NextRequest, db) => {
  const forumId = await ensureGeneralForumId(db);
  if (!forumId) {
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo inicializar el foro en la base de datos.",
      },
      { status: 500 }
    );
  }

  const commentsResult = await CommentRepository.findByForum(db, forumId);
  if (commentsResult.error) {
    return NextResponse.json(
      { success: false, error: commentsResult.error.message },
      { status: 500 }
    );
  }

  const rawComments = (commentsResult.data || []).filter(
    (c: any) => !c.isHiddenByAuthor
  );

  // Resolver usuario actual para traer sus likes reales desde la tabla Like
  const queryUserId = request.nextUrl.searchParams.get("userId");
  const queryUserEmail = request.nextUrl.searchParams.get("userEmail");
  const authResult = await resolveAuthenticatedUserId(request, db, {
    authorId: queryUserId,
    authorEmail: queryUserEmail,
  });

  const likedCommentIds = new Set<string>();
  if (!("error" in authResult) && rawComments.length > 0) {
    const commentIds = rawComments.map((c: any) => String(c.id));
    const { data: userLikes } = await db
      .from("Like")
      .select("commentId")
      .eq("userId", authResult.userId)
      .in("commentId", commentIds);

    if (Array.isArray(userLikes)) {
      for (const row of userLikes) {
        if (row?.commentId) likedCommentIds.add(String(row.commentId));
      }
    }
  }

  const authorIds = Array.from(
    new Set(rawComments.map((c: any) => String(c.authorId)).filter(Boolean))
  );

  const usersMap = new Map<
    string,
    { username?: string; name?: string; email?: string }
  >();

  if (authorIds.length > 0) {
    const { data: users } = await db
      .from("User")
      .select("id, username, name, email")
      .in("id", authorIds);

    if (Array.isArray(users)) {
      for (const u of users) {
        usersMap.set(String(u.id), u);
      }
    }
  }

  const enriched = rawComments.map((c: any) => {
    const author = usersMap.get(String(c.authorId));
    const authorName =
      author?.username ||
      author?.name ||
      (author?.email
        ? author.email.split("@")[0]
        : `Usuario_${String(c.authorId).slice(0, 6)}`);

    const authorSeed = author?.email || author?.username || authorName;

    return {
      ...c,
      authorName,
      authorSeed,
      liked: likedCommentIds.has(String(c.id)),
    };
  });

  return NextResponse.json({
    success: true,
    forumId,
    data: enriched,
  });
});

export const POST = withDatabase(async (request: NextRequest, db) => {
  const body = await request.json().catch(() => null);

  const authResult = await resolveAuthenticatedUserId(request, db, body);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const parentCommentId =
    typeof body?.parentCommentId === "string" && body.parentCommentId.trim()
      ? body.parentCommentId.trim()
      : null;

  if (!content || content.length > 250) {
    return NextResponse.json(
      {
        success: false,
        error: "El comentario debe tener entre 1 y 250 caracteres.",
      },
      { status: 400 }
    );
  }

  const forumId =
    typeof body?.forumId === "string" && body.forumId.trim()
      ? body.forumId.trim()
      : await ensureGeneralForumId(db);

  if (!forumId) {
    return NextResponse.json(
      {
        success: false,
        error: "No se encontró el foro activo en la base de datos.",
      },
      { status: 500 }
    );
  }

  const created = await CommentRepository.create(db, {
    id: crypto.randomUUID(),
    content,
    authorId: authResult.userId,
    forumId,
    parentCommentId,
  });

  if (created.error) {
    return NextResponse.json(
      { success: false, error: created.error.message },
      { status: 500 }
    );
  }

  await db
    .from("Forum")
    .update({ lastActivityDate: new Date().toISOString() })
    .eq("blogId", forumId);

  return NextResponse.json(
    { success: true, data: created.data },
    { status: 201 }
  );
});

export const PATCH = withDatabase(async (request: NextRequest, db) => {
  const body = await request.json().catch(() => null);

  const authResult = await resolveAuthenticatedUserId(request, db, body);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  const commentId =
    typeof body?.commentId === "string" ? body.commentId.trim() : "";

  if (!commentId) {
    return NextResponse.json(
      { success: false, error: "commentId es requerido." },
      { status: 400 }
    );
  }

  // Verificar si ya existe un registro en la tabla Like para este usuario y comentario
  const { data: existingLike } = await db
    .from("Like")
    .select("id")
    .eq("userId", authResult.userId)
    .eq("commentId", commentId)
    .maybeSingle();

  let liked = false;

  if (existingLike?.id) {
    const { error: deleteErr } = await db
      .from("Like")
      .delete()
      .eq("id", existingLike.id);

    if (deleteErr) {
      return NextResponse.json(
        { success: false, error: deleteErr.message },
        { status: 500 }
      );
    }
    liked = false;
  } else {
    const { error: insertErr } = await db.from("Like").insert({
      id: crypto.randomUUID(),
      userId: authResult.userId,
      blogId: null,
      commentId,
    });

    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 }
      );
    }
    liked = true;
  }

  // Sincronizar Comment.likeCount con el conteo real de filas en Like
  const { count } = await db
    .from("Like")
    .select("id", { count: "exact", head: true })
    .eq("commentId", commentId);

  const likeCount = count ?? 0;

  await db
    .from("Comment")
    .update({ likeCount })
    .eq("id", commentId);

  return NextResponse.json({
    success: true,
    liked,
    likeCount,
  });
});