"use client";

import { useState } from "react";
import { FiCornerUpLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Blobatar from "./Blobatar";
import { getBlobatarPalette } from "../constants/blobatar.constants";

const CHIP_PARTICLES = [
  { tx: "-22px", ty: "-20px", size: 5 },
  { tx: "0px", ty: "-26px", size: 4 },
  { tx: "22px", ty: "-18px", size: 5 },
  { tx: "-26px", ty: "2px", size: 4 },
  { tx: "26px", ty: "4px", size: 4 },
  { tx: "-16px", ty: "20px", size: 4 },
  { tx: "18px", ty: "19px", size: 5 },
  { tx: "4px", ty: "-15px", size: 3 },
];

export default function ForumCommentCard({
  comment,
  depth = 0,
  parentColor = null,
  isLastSibling = false,
  onReply,
  onToggleLike,
}) {
  const [expanded, setExpanded] = useState(Boolean(comment.defaultExpanded));
  const [burstKey, setBurstKey] = useState(0);

  const palette = getBlobatarPalette(comment.authorSeed || comment.authorName);
  const accentColor = palette.bg;

  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const hasReplies = replies.length > 0;
  const isLiked = Boolean(comment.liked);

  // Hasta 3 niveles de indentación; a partir del 3ro continúa verticalmente hacia abajo
  const shouldIndent = depth > 0;

  function handleLikeClick() {
    if (!isLiked) {
      setBurstKey((prev) => prev + 1);
    }
    onToggleLike(comment.id);
  }

  return (
    <div className={`relative w-full font-sans ${depth > 0 ? "pt-4" : ""}`}>
      {/* Conector tipo árbol respecto al comentario padre al que se responde */}
      {depth > 0 && parentColor && (
        <>
          {/* Línea vertical continua del color del comentario padre */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: parentColor }}
            className={`absolute left-4 sm:left-6 top-0 w-[2px] ${
              isLastSibling ? "h-[72px]" : "h-full"
            }`}
          />
          {/* Línea horizontal hacia la tarjeta */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: parentColor }}
            className="absolute left-4 sm:left-6 top-[72px] w-6 sm:w-9 h-[2px]"
          />
        </>
      )}

      <div className={`${shouldIndent ? "pl-10 sm:pl-14" : ""} transition-all`}>
        {/* Contenedor de tarjeta + pestaña inferior "view more" */}
        <div className="relative pb-2 pr-2">
          {/* Capa trasera / pestaña inferior coloreada */}
          <div
            aria-hidden="true"
            style={{ backgroundColor: `${accentColor}66` }}
            className={`absolute inset-x-2 top-2 bottom-0 rounded-2xl transition-all ${
              hasReplies ? "pb-6" : ""
            }`}
          />

          {/* Tarjeta principal del comentario */}
          <article
            style={{ borderColor: accentColor }}
            className="relative rounded-2xl bg-[#010736] border-[1.5px] px-5 py-4 sm:px-7 sm:py-5 text-[#FFFAEA] shadow-lg"
          >
            {/* Botón de corazón arriba a la derecha dentro de un círculo sutil */}
            <div className="absolute top-3.5 right-4">
              <button
                type="button"
                onClick={handleLikeClick}
                aria-label={isLiked ? "Quitar me gusta" : "Dar me gusta"}
                style={{
                  backgroundColor: `${accentColor}28`,
                  color: accentColor,
                }}
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-90 cursor-pointer"
              >
                {/* Virutas que salen del corazón al darle like */}
                {burstKey > 0 && isLiked && (
                  <span
                    key={burstKey}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    {CHIP_PARTICLES.map((chip, idx) => (
                      <span
                        key={idx}
                        style={{
                          "--tx": chip.tx,
                          "--ty": chip.ty,
                          width: `${chip.size}px`,
                          height: `${chip.size}px`,
                          backgroundColor: accentColor,
                        }}
                        className="absolute rounded-xs animate-forum-chip"
                      />
                    ))}
                  </span>
                )}

                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 transition-transform duration-200"
                  fill={isLiked ? accentColor : "none"}
                  stroke={accentColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Contenido interno: Blobatar + Usuario + Texto + Responder */}
            <div className="flex items-start gap-4 sm:gap-5 pr-10">
              <div className="pt-1">
                <Blobatar
                  seed={comment.authorSeed || comment.authorName}
                  size={54}
                  inLove={isLiked}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  style={{ color: accentColor }}
                  className="text-base sm:text-[17px] font-bold tracking-tight leading-tight truncate"
                >
                  {comment.authorName}
                </h3>

                <p className="mt-1.5 text-sm sm:text-[15px] font-semibold leading-relaxed text-[#FFFAEA] break-words">
                  {comment.content}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    onReply({
                      id: comment.id,
                      authorName: comment.authorName,
                      accentColor,
                    })
                  }
                  style={{ color: accentColor }}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold opacity-90 hover:opacity-100 hover:underline cursor-pointer"
                >
                  <FiCornerUpLeft className="w-3.5 h-3.5" />
                  <span>Responder</span>
                </button>
              </div>
            </div>
          </article>

          {/* Pestaña "view more" SOLO si el comentario tiene respuestas */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="relative z-10 mt-0.5 ml-6 inline-flex items-center gap-1 text-[11px] font-medium text-[#FFFAEA]/90 hover:text-[#FFFAEA] cursor-pointer"
            >
              {expanded ? (
                <>
                  <FiChevronUp className="w-3.5 h-3.5" />
                  <span>view less ({replies.length})</span>
                </>
              ) : (
                <>
                  <FiChevronDown className="w-3.5 h-3.5" />
                  <span>view more ({replies.length})</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hilo de respuestas desplegable */}
        {hasReplies && expanded && (
          <div>
            {replies.map((reply, idx) => (
              <ForumCommentCard
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                parentColor={accentColor}
                isLastSibling={idx === replies.length - 1}
                onReply={onReply}
                onToggleLike={onToggleLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}