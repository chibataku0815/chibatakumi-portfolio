"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { submitContactForm, type ContactFormState } from "./actions";
import { AnimatedHeading } from "@/shared/components";
import type { ContactPageContent } from "@/shared/data/portfolio";

// ARIGATO - Each letter as individual styled text
const ARIGATO_LETTERS = ['A', 'R', 'I', 'G', 'A', 'T', 'O'];

// =============================================================================
// Contact Form Client Component
// Award-worthy contact experience with elegant form interactions
// =============================================================================

interface ContactClientProps {
  contact: ContactPageContent;
}

const initialState: ContactFormState = {
  success: false,
};

const INQUIRY_OPTIONS = [
  { value: "project", label: "新規プロジェクト" },
  { value: "consultation", label: "技術相談" },
  { value: "collaboration", label: "コラボレーション" },
  { value: "other", label: "その他" },
];

export default function ContactClient({ contact }: ContactClientProps) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const arigatoRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Entry animation
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const fields = containerRef.current?.querySelectorAll(".form-field");
      if (!fields) return;

      gsap.fromTo(
        fields,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.3,
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Success animation with ARIGATO text animation
  useEffect(() => {
    if (state.success && successRef.current && formContainerRef.current) {
      const tl = gsap.timeline();

      // Fade out and hide entire form container (header + form)
      tl.to(formContainerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          if (formContainerRef.current) formContainerRef.current.style.display = "none";
        },
      });

      // Show success container
      tl.set(successRef.current, { display: "flex" });

      // Get all valid ARIGATO letter refs
      const validLetters = arigatoRefs.current.filter(Boolean) as HTMLSpanElement[];

      // Phase 1: ARIGATO letters appear with stagger
      if (validLetters.length > 0) {
        // Set initial state
        gsap.set(validLetters, {
          opacity: 0,
          y: 60,
          scale: 0.8,
          filter: "blur(10px)",
        });

        // Animate letters with dramatic stagger
        tl.to(
          validLetters,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.6,
            stagger: {
              each: 0.08,
              ease: "power2.out",
            },
            ease: "power3.out",
          },
          "+=0.1"
        );

        // Phase 2: Glow effect
        tl.to(
          validLetters,
          {
            textShadow: "0 0 40px rgba(255, 197, 61, 0.8), 0 0 80px rgba(255, 197, 61, 0.4)",
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.2"
        );
      }

      // Animate checkmark stroke
      if (checkRef.current) {
        const pathLength = checkRef.current.getTotalLength();
        tl.fromTo(
          checkRef.current,
          { strokeDasharray: pathLength, strokeDashoffset: pathLength },
          { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" },
          "-=0.4"
        );
      }

      // Fade in text elements
      tl.fromTo(
        successRef.current.querySelectorAll(".success-text"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
        "-=0.3"
      );
    }
  }, [state.success]);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div ref={containerRef} className="w-full max-w-2xl">
        {/* Form Container - wraps header + form for unified hide animation */}
        <div ref={formContainerRef}>
          {/* Header */}
          <div className="mb-16 text-center">
            <AnimatedHeading
              as="h1"
              className="mb-6 text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
            >
              {contact.title}
            </AnimatedHeading>

            <div className="space-y-3">
              {contact.description.split("\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="text-lg leading-relaxed text-[var(--text-muted)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            ref={formRef}
            action={formAction}
            className="space-y-12"
          >
          {/* Name Field */}
          <div className="form-field">
            <FloatingLabelField
              name="name"
              label="お名前"
              type="text"
              required
              error={state.fieldErrors?.name}
              focused={focusedField === "name"}
              hasValue={!!fieldValues.name}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              onChange={(value) => handleFieldChange("name", value)}
            />
          </div>

          {/* Email Field */}
          <div className="form-field">
            <FloatingLabelField
              name="email"
              label="メールアドレス"
              type="email"
              required
              error={state.fieldErrors?.email}
              focused={focusedField === "email"}
              hasValue={!!fieldValues.email}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onChange={(value) => handleFieldChange("email", value)}
            />
          </div>

          {/* Company Field (Optional) */}
          <div className="form-field">
            <FloatingLabelField
              name="company"
              label="会社名 / 所属（任意）"
              type="text"
              error={state.fieldErrors?.company}
              focused={focusedField === "company"}
              hasValue={!!fieldValues.company}
              onFocus={() => setFocusedField("company")}
              onBlur={() => setFocusedField(null)}
              onChange={(value) => handleFieldChange("company", value)}
            />
          </div>

          {/* Inquiry Type */}
          <div className="form-field">
            <label className="mb-4 block text-sm font-medium uppercase tracking-wider text-[var(--text-base-60)]">
              ご相談内容
              <span className="ml-1 text-[var(--text-base-40)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {INQUIRY_OPTIONS.map((option) => (
                <InquiryOption key={option.value} {...option} />
              ))}
            </div>
            {state.fieldErrors?.inquiryType && (
              <p className="mt-3 text-sm text-red-400">{state.fieldErrors.inquiryType}</p>
            )}
          </div>

          {/* Message Field */}
          <div className="form-field">
            <FloatingLabelTextarea
              name="message"
              label="メッセージ"
              required
              error={state.fieldErrors?.message}
              focused={focusedField === "message"}
              hasValue={!!fieldValues.message}
              onFocus={() => setFocusedField("message")}
              onBlur={() => setFocusedField(null)}
              onChange={(value) => handleFieldChange("message", value)}
            />
          </div>

          {/* Global Error */}
          {state.error && (
            <div className="form-field rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
              {state.error}
            </div>
          )}

          {/* Submit Button */}
          <div className="form-field flex flex-col items-center gap-6 pt-4">
            <SubmitButton isPending={isPending} />

            {contact.responseNote && (
              <p className="text-sm text-[var(--text-base-40)]">
                {contact.responseNote}
              </p>
            )}
          </div>
        </form>
        </div>

        {/* Success State */}
        <div
          ref={successRef}
          className="hidden flex-col items-center justify-center py-12 text-center"
        >
          {/* ARIGATO - Giant Text with stagger animation */}
          <div className="mb-12 overflow-hidden">
            <div
              className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3"
              aria-label="ARIGATO"
            >
              {ARIGATO_LETTERS.map((letter, i) => (
                <span
                  key={i}
                  ref={(el) => { arigatoRefs.current[i] = el; }}
                  className="inline-block text-[clamp(3rem,15vw,8rem)] font-bold tracking-tight text-[var(--accent-amber1)]"
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    willChange: "transform, opacity, filter",
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>

          {/* Success Icon with animated stroke */}
          <div className="success-text relative mb-8">
            {/* Outer glow ring */}
            <div className="absolute inset-[-12px] rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--accent-amber1)]">
              <svg
                className="h-10 w-10 text-[var(--accent-amber1)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  ref={checkRef}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="success-text mb-3 text-2xl font-semibold text-[var(--text-base)]">
            送信完了
          </h2>
          <p className="success-text mb-10 text-base leading-relaxed text-[var(--text-muted)]">
            お問い合わせありがとうございます。<br />
            内容を確認の上、2日以内にご連絡いたします。
          </p>

          <a
            href="/"
            data-transition="true"
            className="success-text group inline-flex items-center gap-2 text-[var(--accent-amber1)] transition-opacity hover:opacity-80"
          >
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            トップページへ戻る
          </a>
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// Floating Label Field Component
// =============================================================================

interface FloatingLabelFieldProps {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  error?: string;
  focused: boolean;
  hasValue: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}

function FloatingLabelField({
  name,
  label,
  type,
  required,
  error,
  focused,
  hasValue,
  onFocus,
  onBlur,
  onChange,
}: FloatingLabelFieldProps) {
  const isFloating = focused || hasValue;

  return (
    <div className="group relative">
      {/* Floating Label */}
      <label
        className={`pointer-events-none absolute transition-all duration-300 ease-out ${
          isFloating
            ? "left-0 -top-6 text-xs font-medium uppercase tracking-wider text-[var(--accent-amber1)]"
            : "left-2 top-4 text-base text-[var(--text-base-40)]"
        }`}
      >
        {label}
        {required && <span className="ml-1 text-[var(--text-base-40)]">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          name={name}
          required={required}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 border-b border-[var(--text-base-20)] bg-transparent px-2 py-4 text-[var(--text-base)] focus:outline-none focus:ring-0 transition-colors duration-300 autofill:bg-transparent autofill:text-[var(--text-base)] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--text-base)] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--bg-dark)]"
        />
        {/* Base line */}
        <span className="absolute bottom-0 left-0 h-[1px] w-full bg-[var(--text-base-20)]" />
        {/* Animated highlight line */}
        <span
          className="absolute bottom-0 left-1/2 h-[2px] bg-[var(--accent-amber1)] transition-all duration-500 ease-out"
          style={{
            width: focused ? "100%" : "0%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

// =============================================================================
// Floating Label Textarea Component
// =============================================================================

interface FloatingLabelTextareaProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  focused: boolean;
  hasValue: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}

function FloatingLabelTextarea({
  name,
  label,
  required,
  error,
  focused,
  hasValue,
  onFocus,
  onBlur,
  onChange,
}: FloatingLabelTextareaProps) {
  const isFloating = focused || hasValue;

  return (
    <div className="group relative">
      {/* Floating Label */}
      <label
        className={`pointer-events-none absolute transition-all duration-300 ease-out ${
          isFloating
            ? "left-0 -top-6 text-xs font-medium uppercase tracking-wider text-[var(--accent-amber1)]"
            : "left-2 top-4 text-base text-[var(--text-base-40)]"
        }`}
      >
        {label}
        {required && <span className="ml-1 text-[var(--text-base-40)]">*</span>}
      </label>

      <div className="relative">
        <textarea
          name={name}
          required={required}
          rows={4}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-none border-0 border-b border-[var(--text-base-20)] bg-transparent px-2 py-4 text-[var(--text-base)] focus:outline-none focus:ring-0 transition-colors duration-300"
        />
        {/* Base line */}
        <span className="absolute bottom-0 left-0 h-[1px] w-full bg-[var(--text-base-20)]" />
        {/* Animated highlight line */}
        <span
          className="absolute bottom-0 left-1/2 h-[2px] bg-[var(--accent-amber1)] transition-all duration-500 ease-out"
          style={{
            width: focused ? "100%" : "0%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

// =============================================================================
// Inquiry Option Component
// =============================================================================

interface InquiryOptionProps {
  value: string;
  label: string;
}

function InquiryOption({ value, label }: InquiryOptionProps) {
  return (
    <label className="group/radio relative cursor-pointer">
      <input
        type="radio"
        name="inquiryType"
        value={value}
        required
        className="peer sr-only"
      />
      <span className="relative flex items-center justify-center overflow-hidden rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-sm text-[var(--text-base-60)] transition-all duration-300 peer-checked:border-[var(--accent-amber1)] peer-checked:text-[var(--accent-amber1)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-amber1)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-dark)] hover:border-[var(--text-base-40)] hover:text-[var(--text-base)]">
        {/* Hover fill effect */}
        <span className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--accent-amber1)]/10 transition-transform duration-300 peer-checked:group-[]/radio:scale-y-100 group-hover/radio:scale-y-100" />
        <span className="relative">{label}</span>
      </span>
    </label>
  );
}

// =============================================================================
// Submit Button Component
// =============================================================================

interface SubmitButtonProps {
  isPending: boolean;
}

function SubmitButton({ isPending }: SubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boundingRef = useRef<DOMRect | null>(null);

  // Magnetic hover effect
  const handleMouseEnter = () => {
    if (!buttonRef.current) return;
    boundingRef.current = buttonRef.current.getBoundingClientRect();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current || !boundingRef.current || isPending) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = boundingRef.current;

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = clientX - centerX;
    const distY = clientY - centerY;

    gsap.to(buttonRef.current, {
      x: distX * 0.2,
      y: distY * 0.2,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  return (
    <>
      <style>{`
        @keyframes contactButtonRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes contactButtonPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.02); }
        }
        @keyframes contactButtonShimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes contactSpinner {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <button
        ref={buttonRef}
        type="submit"
        disabled={isPending}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative inline-flex items-center gap-3 will-change-transform disabled:cursor-not-allowed"
      >
        {/* Breathing pulse glow */}
        <span
          className="pointer-events-none absolute inset-[-8px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 197, 61, 0.2) 0%, transparent 70%)",
            animation: isPending ? "none" : "contactButtonPulse 2.5s ease-in-out infinite",
          }}
        />

        {/* Animated border container */}
        <span className="absolute inset-0 overflow-hidden rounded-full">
          {/* Flowing light effect */}
          <span
            className="absolute inset-[-2px] rounded-full"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                transparent 15%,
                rgba(255, 197, 61, 0.4) 20%,
                rgba(255, 197, 61, 1) 25%,
                rgba(255, 197, 61, 0.4) 30%,
                transparent 35%,
                transparent 100%
              )`,
              animation: "contactButtonRotate 3s linear infinite",
              opacity: isPending ? 0.4 : 0.7,
            }}
          />
          {/* Inner mask */}
          <span className="absolute inset-[1.5px] rounded-full bg-[var(--bg-dark)]" />
        </span>

        {/* Shimmer border */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-[var(--accent-amber1)]"
          style={{ animation: "contactButtonShimmer 2s ease-in-out infinite" }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-3 px-8 py-4 text-base font-medium text-[var(--text-base)]">
          {isPending ? (
            <>
              <span
                className="h-4 w-4 rounded-full border-2 border-[var(--accent-amber1)] border-t-transparent"
                style={{ animation: "contactSpinner 0.8s linear infinite" }}
              />
              送信中...
            </>
          ) : (
            <>
              送信する
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </span>
      </button>
    </>
  );
}
