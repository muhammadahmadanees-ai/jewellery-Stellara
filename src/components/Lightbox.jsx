"use client";
import React, { useState, useEffect, useCallback } from "react";

const Lightbox = ({ img, images = [], onClose }) => {
  const allImgs = images.length > 0 ? images : (img ? [img] : []);
  const startIdx = allImgs.indexOf(img);
  const [idx, setIdx] = useState(startIdx >= 0 ? startIdx : 0);

  const current = allImgs[idx] || img;
  const hasMultiple = allImgs.length > 1;

  const goPrev = useCallback(() => setIdx(i => (i - 1 + allImgs.length) % allImgs.length), [allImgs.length]);
  const goNext = useCallback(() => setIdx(i => (i + 1) % allImgs.length), [allImgs.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  const arrowBtn = (side, handler, label, char) => (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); handler(); }}
      style={{
        position: "fixed",
        [side]: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: "52px",
        height: "52px",
        fontSize: "1.8rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 3100,
        backdropFilter: "blur(6px)",
        transition: "background 0.18s, transform 0.18s",
        lineHeight: 1,
        userSelect: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,26,26,0.85)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.55)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
    >{char}</button>
  );

  return (
    <div
      className="modal show"
      style={{ zIndex: 3000, alignItems: "center", justifyContent: "center", padding: 0 }}
      onClick={onClose}
    >
      <span
        onClick={onClose}
        style={{
          position: "fixed", top: "20px", right: "30px",
          fontSize: "40px", color: "#fff", cursor: "pointer",
          zIndex: 3100, textShadow: "0 0 10px rgba(0,0,0,0.6)",
          lineHeight: 1, userSelect: "none",
        }}
      >&times;</span>

      {hasMultiple && arrowBtn("left",  goPrev, "Previous image", "\u2039")}

      <img
        src={current}
        alt="Full screen"
        style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", cursor: "zoom-out", zIndex: 3050, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && arrowBtn("right", goNext, "Next image", "\u203a")}

      {hasMultiple && (
        <div style={{
          position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
          zIndex: 3100,
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {allImgs.map((_, i) => (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                style={{
                  width: i === idx ? "22px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === idx ? "#8B1A1A" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "inline-block",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}
              />
            ))}
          </div>
          <span style={{
            background: "rgba(0,0,0,0.5)", color: "#fff",
            fontSize: "0.75rem", fontWeight: "600",
            padding: "4px 12px", borderRadius: "20px",
            backdropFilter: "blur(4px)", letterSpacing: "1px",
          }}>
            {idx + 1} / {allImgs.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Lightbox;
