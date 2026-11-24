"use client";

import { useState, useEffect, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import { apiFetch } from "../../../lib/api";
import ForumCommentCard from "../components/ForumCommentCard";
import ForumComposerModal from "../components/ForumComposerModal";
import Alert from "../components/ui/Alert";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getAuthenticatedUser() {
  if (typeof window === "undefined") return null;
  try {
    const rawUser = localStorage.getItem("currentUser");
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      null;

    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    const decodedToken = token ? parseJwt(token) : null;

    if (!parsedUser && !decodedToken) return null;
    return {
      ...(decodedToken || {}),
      ...(parsedUser || {}),
      token,
    };
  } catch {
    return null;
  }
}

function buildCommentTree(flatComments) {
  const byId = new Map();

  for (const item of flatComments) {
    const idStr = String(item.id);
    byId.set(idStr, {
      id: idStr,
      authorId: String(item.authorId),
      authorName: item.authorName || "Estudiante IDS",
      authorSeed: item.authorSeed || item.authorName || "racoode",
      content: item.content,
      creationDate: item.creationDate || item.createdAt || null,
      parentCommentId: item.parentCommentId ? String(item.parentCommentId) : null,
      likeCount: Number(item.likeCount ?? 0),
      liked: Boolean(item.liked),
      replies: [],
    });
  }

  const roots = [];

  for (const node of byId.values()) {
    if (node.parentCommentId && byId.has(node.parentCommentId)) {
      byId.get(node.parentCommentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort((a, b) => {
    const tA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
    const tB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
    return tB - tA;
  });

  const sortReplies = (nodes) => {
    nodes.sort((a, b) => {
      const tA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
      const tB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
      return tA - tB;
    });
    for (const n of nodes) {
      if (n.replies.length > 0) sortReplies(n.replies);
    }
  };
  sortReplies(roots);

  return roots;
}

function toggleLikeRecursive(list, targetId) {
  return list.map((item) => {
    if (item.id === targetId) {
      const nextLiked = !item.liked;
      return {
        ...item,
        liked: nextLiked,
        likeCount: nextLiked
          ? (item.likeCount || 0) + 1
          : Math.max(0, (item.likeCount || 0) - 1),
      };
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: toggleLikeRecursive(item.replies, targetId),
      };
    }
    return item;
  });
}

function expandParentRecursive(list, parentId) {
  return list.map((item) => {
    if (item.id === parentId) {
      return { ...item, defaultExpanded: true };
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: expandParentRecursive(item.replies, parentId),
      };
    }
    return item;
  });
}

function buildForumUrl() {
  const user = getAuthenticatedUser();
  const params = new URLSearchParams();
  const uid = user?.id || user?.sub || user?.userId;
  if (uid) params.set("userId", String(uid));
  if (user?.email) params.set("userEmail", String(user.email));
  const qs = params.toString();
  return qs ? `/api/forum?${qs}` : "/api/forum";
}

export default function ForumPage() {
  const [forumId, setForumId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  const loadForumComments = useCallback(async (expandParentId = null) => {
    try {
      const json = await apiFetch(buildForumUrl(), {
        method: "GET",
        cache: "no-store",
      });

      if (!json?.success) {
        setErrorMsg(
          json?.message || json?.error || "No se pudieron cargar los comentarios del foro."
        );
        setComments([]);
        return;
      }

      setForumId(json.forumId || null);

      let tree = buildCommentTree(Array.isArray(json.data) ? json.data : []);
      if (expandParentId) {
        tree = expandParentRecursive(tree, expandParentId);
      }
      setComments(tree);
      setErrorMsg("");
    } catch {
      setErrorMsg("Error de conexión al cargar el foro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiFetch(buildForumUrl(), { method: "GET", cache: "no-store" })
      .then((json) => {
        if (!isMounted) return;
        if (!json?.success) {
          setErrorMsg(
            json?.message || json?.error || "No se pudieron cargar los comentarios."
          );
          setComments([]);
          return;
        }
        setForumId(json.forumId || null);
        setComments(buildCommentTree(Array.isArray(json.data) ? json.data : []));
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Error de conexión al cargar el foro.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleOpenNewComment() {
    const user = getAuthenticatedUser();
    if (!user) {
      setErrorMsg("Debes iniciar sesión para publicar un comentario en el foro.");
      return;
    }
    setErrorMsg("");
    setReplyTarget(null);
    setComposerOpen(true);
  }

  function handleOpenReply(target) {
    const user = getAuthenticatedUser();
    if (!user) {
      setErrorMsg("Debes iniciar sesión para responder a un comentario.");
      return;
    }
    setErrorMsg("");
    setReplyTarget(target);
    setComposerOpen(true);
  }

  async function handleToggleLike(commentId) {
    const user = getAuthenticatedUser();
    if (!user) {
      setErrorMsg("Debes iniciar sesión para dar me gusta a un comentario.");
      return;
    }

    // Actualización optimista instantánea
    setComments((prev) => toggleLikeRecursive(prev, commentId));

    const json = await apiFetch("/api/forum", {
      method: "PATCH",
      body: JSON.stringify({
        commentId,
        authorId: user.id || user.sub || user.userId || null,
        authorEmail: user.email || null,
      }),
    });

    if (!json?.success) {
      // Revertir si hubo error en BD
      setComments((prev) => toggleLikeRecursive(prev, commentId));
      setErrorMsg(json?.error || "No se pudo guardar tu like en la base de datos.");
    }
  }

  async function handlePublishComment({ content, parentId }) {
    const user = getAuthenticatedUser();
    if (!user) {
      setErrorMsg("Debes iniciar sesión para comentar en el foro.");
      return;
    }

    const json = await apiFetch("/api/forum", {
      method: "POST",
      body: JSON.stringify({
        forumId,
        content,
        parentCommentId: parentId,
        authorId: user.id || user.sub || user.userId || null,
        authorEmail: user.email || null,
      }),
    });

    if (!json?.success) {
      setErrorMsg(
        json?.error ||
          json?.message ||
          "No se pudo guardar el comentario en la base de datos."
      );
      return;
    }

    await loadForumComments(parentId);
  }

  return (
    <section className="relative w-full py-12 md:py-16 font-sans">
      <div className="max-w-5xl mx-auto px-5 sm:px-10">
        {/* Cabecera del Foro */}
        <div className="mb-10">
          <h1 className="font-lalezar text-5xl sm:text-6xl leading-none text-[#FFFAEA]">
            Foro <span className="text-[#9FA1FF]">Racoode</span>
          </h1>
          <p className="font-jost text-base sm:text-lg text-[#FFFAEA]/80 mt-2">
            Cuéntanos algo sobre ti y sé libre de comentar, compartir ideas o conversar con la comunidad
          </p>
        </div>

        {errorMsg && (
          <Alert type="error" className="mb-6">
            {errorMsg}
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-full h-36 rounded-2xl bg-[#FFFAEA]/5 animate-pulse"
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-[#9FA1FF]/25 bg-[#070E4A]/40 p-10 text-center text-[#FFFAEA]/75">
            Aún no hay comentarios en el foro. Haz clic en el botón{" "}
            <span className="text-[#9FA1FF] font-bold">+</span> de abajo a la izquierda
            para publicar el primero.
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <ForumCommentCard
                key={comment.id}
                comment={comment}
                depth={0}
                onReply={handleOpenReply}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante fijo abajo a la izquierda apuntando hacia la derecha */}
      <button
        type="button"
        onClick={handleOpenNewComment}
        aria-label="Nuevo comentario en el foro"
        className="fixed bottom-8 left-6 sm:left-10 z-40 w-14 h-14 rounded-full rounded-tr-xl rotate-45 bg-[#9FA1FF] hover:bg-[#9747FF] text-[#FFFAEA] shadow-[0_10px_30px_rgba(151,71,255,0.45)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
      >
        <FiPlus className="w-7 h-7 -rotate-45 stroke-[2.8]" />
      </button>

      {/* Modal de creación / respuesta */}
      <ForumComposerModal
        key={replyTarget ? `reply-${replyTarget.id}` : "new-comment"}
        isOpen={composerOpen}
        replyTo={replyTarget}
        onClose={() => setComposerOpen(false)}
        onPublish={handlePublishComment}
      />
    </section>
  );
}