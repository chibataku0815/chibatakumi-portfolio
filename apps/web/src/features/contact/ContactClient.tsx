"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { submitContactForm, type ContactFormState } from "./actions";
import { AnimatedHeading } from "@/shared/components";

// ARIGATO — kept as a stylistic brand element on success, identical for both
// locales (a Japanese romanization that reads as a warm thanks regardless of
// the visitor's language).
const ARIGATO_LETTERS = ['A', 'R', 'I', 'G', 'A', 'T', 'O'];

// =============================================================================
// Contact Form Client Component
// Renewal 2026 reset (parent plan §4.1 / §5.4): minimal, localized contact
// surface.
// - Visible copy comes from `messages/{ja,en}.json` under the `contact`
//   namespace via next-intl `useTranslations`.
// - Email channel is surfaced as a visible mailto link (primary path).
// - Inquiry-type radio and company field were removed because they read as a
//   sales/service funnel and made false promises about offerings that belong to
//   the /photography and /filmtone satellite LPs.
// - Submit button reduced to a single-stroke accent (no magnetic / shimmer /
//   conic-gradient layers) so the form reads as a quiet secondary path.
// - Locale is forwarded to the server action via a hidden form field so error
//   messages render in the visitor's language.
// =============================================================================

interface ContactClientProps {
  email: string;
  locale: string;
}

const initialState: ContactFormState = {
  success: false,
};

export default function ContactClient({ email, locale }: ContactClientProps) {
  const t = useTranslations("contact");
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
      const fields = containerRef.current?.querySelectorAll(".form-field, .contact-channel");
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

      tl.to(formContainerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          if (formContainerRef.current) formContainerRef.current.style.display = "none";
        },
      });

      tl.set(successRef.current, { display: "flex" });

      const validLetters = arigatoRefs.current.filter(Boolean) as HTMLSpanElement[];

      if (validLetters.length > 0) {
        gsap.set(validLetters, {
          opacity: 0,
          y: 60,
          scale: 0.8,
          filter: "blur(10px)",
        });

        tl.to(
          validLetters,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.6,
            stagger: { each: 0.08, ease: "power2.out" },
            ease: "power3.out",
          },
          "+=0.1"
        );

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

      if (checkRef.current) {
        const pathLength = checkRef.current.getTotalLength();
        tl.fromTo(
          checkRef.current,
          { strokeDasharray: pathLength, strokeDashoffset: pathLength },
          { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" },
          "-=0.4"
        );
      }

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

  const description = t("description");
  const successBody = t("success.body");
  const homeHref = locale === "ja" ? "/" : "/en";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div ref={containerRef} className="w-full max-w-2xl">
        <div ref={formContainerRef}>
          {/* Header */}
          <div className="mb-12 text-center">
            <AnimatedHeading
              as="h1"
              className="mb-6 text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
            >
              {t("title")}
            </AnimatedHeading>

            <div className="space-y-3">
              {description.split("\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="text-lg leading-relaxed text-[var(--text-muted)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Primary contact channel — visible email */}
          <div className="contact-channel mb-16 flex flex-col items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-base-40)]">
              {t("channelLabel")}
            </span>
            <a
              href={`mailto:${email}`}
              className="text-lg font-medium text-[var(--text-base)] underline decoration-[var(--accent-amber1)]/40 decoration-1 underline-offset-[6px] transition-colors duration-300 hover:decoration-[var(--accent-amber1)] sm:text-xl"
            >
              {email}
            </a>
          </div>

          {/* Secondary path — quiet message form */}
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[var(--text-base-20)]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-base-40)]">
              {t("formDivider")}
            </span>
            <span className="h-px flex-1 bg-[var(--text-base-20)]" />
          </div>

          <form
            ref={formRef}
            action={formAction}
            className="space-y-12"
          >
            {/* Locale propagation for the server action so error messages
                render in the visitor's language. */}
            <input type="hidden" name="locale" value={locale} />

            {/* Name Field */}
            <div className="form-field">
              <FloatingLabelField
                name="name"
                label={t("form.name")}
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
                label={t("form.email")}
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

            {/* Message Field */}
            <div className="form-field">
              <FloatingLabelTextarea
                name="message"
                label={t("form.message")}
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
              <SubmitButton
                isPending={isPending}
                submitLabel={t("form.submit")}
                submittingLabel={t("form.submitting")}
              />

              <p className="text-sm text-[var(--text-base-40)]">
                {t("responseNote")}
              </p>
            </div>
          </form>
        </div>

        {/* Success State */}
        <div
          ref={successRef}
          className="hidden flex-col items-center justify-center py-12 text-center"
        >
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

          <div className="success-text relative mb-8">
            <div
              className="absolute inset-[-12px] rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
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
            {t("success.heading")}
          </h2>
          <p className="success-text mb-10 text-base leading-relaxed text-[var(--text-muted)]">
            {successBody.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>

          <a
            href={homeHref}
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
            {t("success.back")}
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
        <span className="absolute bottom-0 left-0 h-[1px] w-full bg-[var(--text-base-20)]" />
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
        <span className="absolute bottom-0 left-0 h-[1px] w-full bg-[var(--text-base-20)]" />
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
// Submit Button — quiet single-stroke accent (renewal 2026 reset).
// =============================================================================

interface SubmitButtonProps {
  isPending: boolean;
  submitLabel: string;
  submittingLabel: string;
}

function SubmitButton({ isPending, submitLabel, submittingLabel }: SubmitButtonProps) {
  return (
    <>
      <style>{`
        @keyframes contactSpinner {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <button
        type="submit"
        disabled={isPending}
        className="group inline-flex items-center gap-3 rounded-full border border-[var(--accent-amber1)]/60 px-8 py-3.5 text-base font-medium text-[var(--text-base)] transition-colors duration-300 hover:border-[var(--accent-amber1)] hover:bg-[var(--accent-amber1)]/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <span
              className="h-4 w-4 rounded-full border-2 border-[var(--accent-amber1)] border-t-transparent"
              style={{ animation: "contactSpinner 0.8s linear infinite" }}
            />
            {submittingLabel}
          </>
        ) : (
          <>
            {submitLabel}
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
      </button>
    </>
  );
}
