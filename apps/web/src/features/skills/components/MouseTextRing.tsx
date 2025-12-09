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
 * - マウスに追従する回転テキストリング（デスクトップ）
 * - タップで出現する回転テキストリング（モバイル）
 * - 複数レイヤーのギミック（内外リング、パーティクル）
 * - Signature Moment: 視覚的インパクト強化
 */
export function MouseTextRing({ text, accentColor, isVisible }: MouseTextRingProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [showMobileRing, setShowMobileRing] = useState(false);
  const mobileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef(false);

  // デスクトップ: マウス追従（スムーズ補間）
  useEffect(() => {
    // 初期化時にデバイス判定
    const isTouch = !window.matchMedia("(pointer: fine)").matches;
    isTouchRef.current = isTouch;

    if (isTouch) return;

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
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      setPos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // モバイル: タップで出現
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      setPos({ x: touch.clientX, y: touch.clientY });
      setShowMobileRing(true);

      // 既存タイマーをクリア
      if (mobileTimeoutRef.current) {
        clearTimeout(mobileTimeoutRef.current);
      }

      // 2.5秒後にフェードアウト
      mobileTimeoutRef.current = setTimeout(() => {
        setShowMobileRing(false);
      }, 2500);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      if (mobileTimeoutRef.current) {
        clearTimeout(mobileTimeoutRef.current);
      }
    };
  }, []);

  // 出現/消滅アニメーション
  // モバイル: showMobileRingで制御、デスクトップ: isVisibleで制御
  // タッチデバイスでも常にshowMobileRingを優先（タップ時に表示）
  const shouldShow = showMobileRing || isVisible;

  useEffect(() => {
    if (!ringRef.current) return;

    if (shouldShow) {
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
  }, [shouldShow]);

  // リング設定
  const outerRadius = 70;
  const innerRadius = 40;
  const containerSize = outerRadius * 2 + 20;

  // 外側テキストリング
  const outerText = `${displayText} • ${displayText} • ${displayText} • `;
  const outerChars = outerText.split("");

  // 内側装飾リング（ダッシュパターン）
  const dashCount = 24;
  const dashes = Array.from({ length: dashCount }, (_, i) => i);

  // パーティクル（浮遊ドット）
  const particleCount = 8;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  // モバイル用のデフォルトテキスト・色
  const displayText = showMobileRing && !text ? "Touch" : (text || "Touch");
  const displayColor = accentColor ?? "#e8a85a";

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: pos.x,
        top: pos.y,
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
          boxShadow: displayColor
            ? `0 0 40px ${displayColor}60, 0 0 80px ${displayColor}30, 0 0 120px ${displayColor}15`
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
                color: displayColor ?? "rgba(255,255,255,0.9)",
                textShadow: displayColor
                  ? `0 0 6px ${displayColor}, 0 0 12px ${displayColor}80`
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
                backgroundColor: displayColor ?? "rgba(255,255,255,0.7)",
                boxShadow: displayColor
                  ? `0 0 4px ${displayColor}`
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
              backgroundColor: displayColor ?? "rgba(255,255,255,0.8)",
              boxShadow: displayColor
                ? `0 0 6px ${displayColor}, 0 0 12px ${displayColor}`
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
            backgroundColor: displayColor ?? "rgba(255,255,255,0.8)",
            boxShadow: displayColor ? `0 0 4px ${displayColor}` : "none",
          }}
        />
        {/* 横線 */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            width: "12px",
            height: "1px",
            left: "-6px",
            backgroundColor: displayColor ?? "rgba(255,255,255,0.8)",
            boxShadow: displayColor ? `0 0 4px ${displayColor}` : "none",
          }}
        />
        {/* 中央ドット */}
        <div
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            backgroundColor: displayColor ?? "rgba(255,255,255,0.9)",
            boxShadow: displayColor
              ? `0 0 8px ${displayColor}, 0 0 16px ${displayColor}, 0 0 24px ${displayColor}80`
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
              backgroundColor: displayColor ?? "rgba(255,255,255,0.6)",
              boxShadow: displayColor ? `0 0 3px ${displayColor}` : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}
