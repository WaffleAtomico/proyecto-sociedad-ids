"use client";

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

const MAX_CHARS = 250;

export default function ForumComposerModal({
  isOpen,
  replyTo = null,
  onClose,
  onPublish,
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = content.trim().length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (isOverLimit || isEmpty || submitting) return;

    setSubmitting(true);
    try {
      await onPublish({
        content: content.trim(),
        parentId: replyTo ? replyTo.id : null,
      });
      setContent("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#010736]/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forum-composer-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#070E4A]/95 border border-[#9747FF]/60 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.65)] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-[#9747FF] text-[#FFFAEA] flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Título dinámico: Nuevo comentario o Responder a @username */}
        <h2
          id="forum-composer-title"
          className="text-2xl sm:text-3xl font-bold text-[#FFFAEA] mb-5 pr-10"
        >
          {replyTo ? (
            <>
              Responder a{" "}
              <span style={{ color: replyTo.accentColor || "#9FA1FF" }}>
                {replyTo.authorName}
              </span>
            </>
          ) : (
            "Nuevo comentario en el foro."
          )}
        </h2>

        {isOverLimit && (
          <Alert type="error" className="mb-4">
            Has excedido el límite de {MAX_CHARS} caracteres ({charCount}/
            {MAX_CHARS}). Reduce tu mensaje para poder publicarlo.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe aquí tu comentario."
            className={`w-full rounded-2xl bg-[#181F5B]/85 p-5 text-base sm:text-lg text-[#FFFAEA] placeholder-[#FFFAEA]/55 resize-none focus:outline-none border transition-colors ${
              isOverLimit
                ? "border-red-400 focus:border-red-400"
                : "border-transparent focus:border-[#9FA1FF]/50"
            }`}
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            <span
              className={`text-sm font-medium ${
                isOverLimit ? "text-red-300 font-bold" : "text-[#FFFAEA]/80"
              }`}
            >
              {charCount}/{MAX_CHARS} caracteres.
            </span>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={submitting}
              disabled={isOverLimit || isEmpty}
              className="px-7 py-2.5 text-sm font-bold"
            >
              Publicar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}