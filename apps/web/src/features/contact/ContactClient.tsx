"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { submitContactForm, type ContactFormState } from "@/app/contact/actions";
import { AnimatedHeading } from "@/shared/components";
import type { ContactPageContent } from "@/shared/data/portfolio";

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
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Success animation
  useEffect(() => {
    if (state.success && successRef.current && formRef.current) {
      const tl = gsap.timeline();

      // Fade out form
      tl.to(formRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.inOut",
      });

      // Show success message
      tl.fromTo(
        successRef.current,
        { opacity: 0, y: 30, display: "none" },
        { opacity: 1, y: 0, display: "flex", duration: 0.6, ease: "power3.out" }
      );
    }
  }, [state.success]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl">
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
          className="space-y-10"
        >
          {/* Name Field */}
          <FormField
            name="name"
            label="お名前"
            type="text"
            required
            error={state.fieldErrors?.name}
            focused={focusedField === "name"}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Email Field */}
          <FormField
            name="email"
            label="メールアドレス"
            type="email"
            required
            error={state.fieldErrors?.email}
            focused={focusedField === "email"}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Company Field (Optional) */}
          <FormField
            name="company"
            label="会社名 / 所属"
            type="text"
            error={state.fieldErrors?.company}
            focused={focusedField === "company"}
            onFocus={() => setFocusedField("company")}
            onBlur={() => setFocusedField(null)}
          />

          {/* Inquiry Type */}
          <div className="group">
            <label className="mb-4 block text-sm font-medium uppercase tracking-wider text-[var(--text-base-60)]">
              ご相談内容
              <span className="ml-1 text-[var(--accent-amber1)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {INQUIRY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="group/radio relative cursor-pointer"
                >
                  <input
                    type="radio"
                    name="inquiryType"
                    value={option.value}
                    required
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-sm text-[var(--text-base-60)] transition-all duration-300 peer-checked:border-[var(--accent-amber1)] peer-checked:text-[var(--accent-amber1)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-amber1)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-dark)] hover:border-[var(--text-base-40)]">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            {state.fieldErrors?.inquiryType && (
              <p className="mt-2 text-sm text-red-400">{state.fieldErrors.inquiryType}</p>
            )}
          </div>

          {/* Message Field */}
          <div className="group">
            <label className="mb-3 block text-sm font-medium uppercase tracking-wider text-[var(--text-base-60)]">
              メッセージ
              <span className="ml-1 text-[var(--accent-amber1)]">*</span>
            </label>
            <div className="relative">
              <textarea
                name="message"
                required
                rows={5}
                placeholder="プロジェクトの概要やご相談内容をお聞かせください"
                onFocus={() => setFocusedField("message")}
                onBlur={() => setFocusedField(null)}
                className="w-full resize-none border-0 border-b border-[var(--text-base-20)] bg-transparent py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-20)] focus:border-[var(--accent-amber1)] focus:outline-none focus:ring-0 transition-colors duration-300"
              />
              {/* Focus indicator line */}
              <span
                className={`absolute bottom-0 left-0 h-[2px] bg-[var(--accent-amber1)] transition-all duration-500 ease-out ${
                  focusedField === "message" ? "w-full" : "w-0"
                }`}
              />
            </div>
            {state.fieldErrors?.message && (
              <p className="mt-2 text-sm text-red-400">{state.fieldErrors.message}</p>
            )}
          </div>

          {/* Global Error */}
          {state.error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
              {state.error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-6 pt-6">
            <SubmitButton isPending={isPending} />

            {contact.responseNote && (
              <p className="text-sm text-[var(--text-base-40)]">
                {contact.responseNote}
              </p>
            )}
          </div>
        </form>

        {/* Success State */}
        <div
          ref={successRef}
          className="hidden flex-col items-center justify-center text-center"
        >
          {/* Success Icon */}
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--accent-amber1)]">
            <svg
              className="h-10 w-10 text-[var(--accent-amber1)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="mb-4 text-3xl font-semibold text-[var(--text-base)]">
            送信完了
          </h2>
          <p className="mb-8 text-lg text-[var(--text-muted)]">
            お問い合わせありがとうございます。<br />
            内容を確認の上、2日以内にご連絡いたします。
          </p>

          <a
            href="/"
            data-transition="true"
            className="inline-flex items-center gap-2 text-[var(--accent-amber1)] transition-opacity hover:opacity-80"
          >
            <svg
              className="h-4 w-4 rotate-180"
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
            トップページへ戻る
          </a>
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// Form Field Component
// =============================================================================

interface FormFieldProps {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  error?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

function FormField({
  name,
  label,
  type,
  required,
  error,
  focused,
  onFocus,
  onBlur,
}: FormFieldProps) {
  return (
    <div className="group">
      <label className="mb-3 block text-sm font-medium uppercase tracking-wider text-[var(--text-base-60)]">
        {label}
        {required && <span className="ml-1 text-[var(--accent-amber1)]">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          required={required}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full border-0 border-b border-[var(--text-base-20)] bg-transparent py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-20)] focus:border-[var(--accent-amber1)] focus:outline-none focus:ring-0 transition-colors duration-300"
        />
        {/* Focus indicator line */}
        <span
          className={`absolute bottom-0 left-0 h-[2px] bg-[var(--accent-amber1)] transition-all duration-500 ease-out ${
            focused ? "w-full" : "w-0"
          }`}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
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
              "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.2) 0%, transparent 70%)",
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
                rgba(245, 158, 11, 0.4) 20%,
                rgba(245, 158, 11, 1) 25%,
                rgba(245, 158, 11, 0.4) 30%,
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

        {/* Static border */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-[var(--accent-amber1)]"
          style={{ opacity: 0.5 }}
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
