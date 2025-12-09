"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface MouseTextRingProps {
  text: string;
  accentColor: string | null;
  isVisible: boolean;
}

/**
 * MouseTextRing
 * - マウスに追従する回転テキストリング
 * - 複数レイヤーのギミック（内外リング、パーティクル）
 * - Signature Moment: 視覚的インパクト強化
 */
export function MouseTextRing({ text, accentColor, isVisible }: MouseTextRingProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [canHover, setCanHover] = useState(true);

  // モバイル判定
  useEffect(() => {
    setCanHover(window.matchMedia("(pointer: fine)").matches);
  }, []);

  // マウス追従（スムーズ補間）
  useEffect(() => {
    if (!canHover) return;

    let targetX = -200;
    let targetY = -200;
    let currentX = -200;
    let currentY = -200;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      // スムーズ補間（遅延追従）
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      setMousePos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [canHover]);

  // 出現/消滅アニメーション
  useEffect(() => {
    if (!ringRef.current) return;

    if (isVisible && canHover) {
      gsap.to(ringRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
      });
    } else {
      gsap.to(ringRef.current, {
        scale: 0.3,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
    }
  }, [isVisible, canHover]);

  if (!canHover) return null;

  // リング設定
  const outerRadius = 70;
  const innerRadius = 40;
  const containerSize = outerRadius * 2 + 20;

  // 外側テキストリング
  const outerText = `${text} • ${text} • ${text} • `;
  const outerChars = outerText.split("");

  // 内側装飾リング（ダッシュパターン）
  const dashCount = 24;
  const dashes = Array.from({ length: dashCount }, (_, i) => i);

  // パーティクル（浮遊ドット）
  const particleCount = 8;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: mousePos.x,
        top: mousePos.y,
        width: containerSize,
        height: containerSize,
        marginLeft: -containerSize / 2,
        marginTop: -containerSize / 2,
        opacity: 0,
        transform: "scale(0.3)",
      }}
    >
      {/* 最外周グロー */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: accentColor
            ? `0 0 40px ${accentColor}60, 0 0 80px ${accentColor}30, 0 0 120px ${accentColor}15`
            : "none",
        }}
      />

      {/* 外側テキストリング（時計回り） */}
      <div
        className="absolute inset-0 animate-spin"
        style={{
          animationDuration: "15s",
          animationTimingFunction: "linear",
        }}
      >
        {outerChars.map((char, index) => {
          const angle = (index / outerChars.length) * 360;
          return (
            <span
              key={`outer-${index}`}
              className="absolute left-1/2 top-1/2 font-mono text-[9px] font-bold uppercase"
              style={{
                color: accentColor ?? "rgba(255,255,255,0.9)",
                textShadow: accentColor
                  ? `0 0 6px ${accentColor}, 0 0 12px ${accentColor}80`
                  : "0 0 6px rgba(255,255,255,0.5)",
                transform: `
                  translate(-50%, -50%)
                  rotate(${angle}deg)
                  translateY(-${outerRadius}px)
                  rotate(90deg)
                `,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* 内側ダッシュリング（反時計回り） */}
      <div
        className="absolute inset-0 animate-spin"
        style={{
          animationDuration: "8s",
          animationTimingFunction: "linear",
          animationDirection: "reverse",
        }}
      >
        {dashes.map((_, index) => {
          const angle = (index / dashCount) * 360;
          const isLong = index % 3 === 0;
          return (
            <div
              key={`dash-${index}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: isLong ? "8px" : "4px",
                height: "2px",
                backgroundColor: accentColor ?? "rgba(255,255,255,0.7)",
                boxShadow: accentColor
                  ? `0 0 4px ${accentColor}`
                  : "0 0 4px rgba(255,255,255,0.5)",
                opacity: isLong ? 0.9 : 0.5,
                transform: `
                  translate(-50%, -50%)
                  rotate(${angle}deg)
                  translateY(-${innerRadius}px)
                `,
              }}
            />
          );
        })}
      </div>

      {/* 浮遊パーティクル */}
      {particles.map((_, index) => {
        const angle = (index / particleCount) * 360;
        const distance = innerRadius + 15 + (index % 3) * 8;
        const size = 2 + (index % 2);
        const duration = 3 + (index % 3);
        return (
          <div
            key={`particle-${index}`}
            className="absolute left-1/2 top-1/2 rounded-full animate-pulse"
            style={{
              width: size,
              height: size,
              backgroundColor: accentColor ?? "rgba(255,255,255,0.8)",
              boxShadow: accentColor
                ? `0 0 6px ${accentColor}, 0 0 12px ${accentColor}`
                : "0 0 6px rgba(255,255,255,0.6)",
              animationDuration: `${duration}s`,
              transform: `
                translate(-50%, -50%)
                rotate(${angle + 22.5}deg)
                translateY(-${distance}px)
              `,
            }}
          />
        );
      })}

      {/* 中央クロスヘア */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* 縦線 */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: "1px",
            height: "12px",
            top: "-6px",
            backgroundColor: accentColor ?? "rgba(255,255,255,0.8)",
            boxShadow: accentColor ? `0 0 4px ${accentColor}` : "none",
          }}
        />
        {/* 横線 */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            width: "12px",
            height: "1px",
            left: "-6px",
            backgroundColor: accentColor ?? "rgba(255,255,255,0.8)",
            boxShadow: accentColor ? `0 0 4px ${accentColor}` : "none",
          }}
        />
        {/* 中央ドット */}
        <div
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            backgroundColor: accentColor ?? "rgba(255,255,255,0.9)",
            boxShadow: accentColor
              ? `0 0 8px ${accentColor}, 0 0 16px ${accentColor}, 0 0 24px ${accentColor}80`
              : "0 0 8px rgba(255,255,255,0.8)",
          }}
        />
      </div>

      {/* コーナーブラケット */}
      {[0, 90, 180, 270].map((rotation) => (
        <div
          key={`bracket-${rotation}`}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotation}deg) translate(${outerRadius - 8}px, 0)`,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "1px",
              backgroundColor: accentColor ?? "rgba(255,255,255,0.6)",
              boxShadow: accentColor ? `0 0 3px ${accentColor}` : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}
