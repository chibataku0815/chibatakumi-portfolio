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

  const successBody = t("success.body");
  const homeHref = locale === "ja" ? "/" : "/en";

  return (
    <main ref={containerRef} className="relative min-h-screen w-full">
      <div ref={formContainerRef}>
        <header
          data-readability="focus"
          className="px-6 pt-32 pb-16 sm:px-12 sm:pt-40 sm:pb-24 lg:px-20"
        >
          <div className="mx-auto max-w-[44rem]">
            <AnimatedHeading
              as="h1"
              className="text-[clamp(3rem,8vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[var(--text-base)]"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              {t("title")}
            </AnimatedHeading>
          </div>
        </header>

        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 sm:pb-40 lg:px-20"
        >
          <div className="mx-auto max-w-[44rem]">
            <div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.22), transparent)",
              }}
            />

            <div className="mt-16 flex flex-col items-start gap-2">
              <span className="font-sans font-medium text-[10px] uppercase tracking-[0.16em] text-[var(--text-base-50)]">
                Email
              </span>
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-11 items-center text-[1.25rem] font-medium leading-[1.4] text-[var(--text-base)] underline decoration-[var(--text-base-30)] decoration-1 underline-offset-[8px] transition-colors duration-300 hover:decoration-[var(--text-base)] sm:text-[1.5rem]"
                style={{ fontFamily: "var(--font-family-display)" }}
              >
                {email}
              </a>
            </div>

            <div className="mt-24 mb-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--text-base-20)]" />
              <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-base-50)]">
                {t("formDivider")}
              </span>
              <span className="h-px flex-1 bg-[var(--text-base-20)]" />
            </div>

            <form ref={formRef} action={formAction} className="space-y-16">
              <input type="hidden" name="locale" value={locale} />

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

              {state.error && (
                <div
                  className="border-y border-[var(--text-base-30)] py-4 text-sm text-[var(--text-base-80)]"
                  role="alert"
                >
                  {state.error}
                </div>
              )}

              <div className="flex flex-col items-start gap-8 pt-8">
                <SubmitButton
                  isPending={isPending}
                  submitLabel={t("form.submit")}
                  submittingLabel={t("form.submitting")}
                />
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-base-50)]">
                  {t("responseNote")}
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Success State */}
      <div
        ref={successRef}
        className="hidden min-h-screen w-full flex-col items-center justify-center px-6 py-32"
      >
        <div className="mb-16 overflow-hidden">
          <div
            className="flex items-end justify-center gap-2 sm:gap-4"
            aria-label="ARIGATO"
          >
            {ARIGATO_LETTERS.map((letter, i) => (
              <span
                key={i}
                ref={(el) => { arigatoRefs.current[i] = el; }}
                className="inline-block text-[clamp(3rem,15vw,8rem)] font-medium leading-none tracking-[-0.02em] text-[var(--text-base)]"
                style={{
                  fontFamily: "var(--font-family-display)",
                  willChange: "transform, opacity, filter",
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        <div className="success-text mb-16 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--text-base-40)]">
          <svg
            className="h-8 w-8 text-[var(--text-base)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              ref={checkRef}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2
          className="success-text mb-8 text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--text-base)]"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          {t("success.heading")}
        </h2>
        <p className="success-text mb-16 max-w-[32rem] text-center text-[1rem] leading-[1.75] text-[var(--text-base-80)]">
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
          className="success-text group inline-flex items-center gap-2 font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-base-60)] transition-colors duration-300 hover:text-[var(--text-base)]"
        >
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          {t("success.back")}
        </a>
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
            ? "left-0 -top-6 font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-base-60)]"
            : "left-0 top-4 text-base text-[var(--text-base-50)]"
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
          className="w-full border-0 border-b border-[var(--text-base-20)] bg-transparent px-2 py-4 text-[var(--text-base)] focus:outline-none focus:ring-0 transition-colors duration-300 autofill:bg-transparent autofill:text-[var(--text-base)] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--text-base)] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--bg-primary)]"
        />
        <span className="absolute bottom-0 left-0 h-[1px] w-full bg-[var(--text-base-20)]" />
        <span
          className="absolute bottom-0 left-1/2 h-px bg-[var(--text-base)] transition-all duration-500 ease-out"
          style={{
            width: focused ? "100%" : "0%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      {error && <p className="mt-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-base-70)]">{error}</p>}
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
            ? "left-0 -top-6 font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-base-60)]"
            : "left-0 top-4 text-base text-[var(--text-base-50)]"
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
          className="absolute bottom-0 left-1/2 h-px bg-[var(--text-base)] transition-all duration-500 ease-out"
          style={{
            width: focused ? "100%" : "0%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      {error && <p className="mt-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-base-70)]">{error}</p>}
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
        className="group inline-flex min-h-11 items-center gap-4 border-b border-[var(--text-base)] font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-base)] transition-opacity duration-300 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <>
            <span
              className="h-3 w-3 rounded-full border border-[var(--text-base)] border-t-transparent"
              style={{ animation: "contactSpinner 0.8s linear infinite" }}
            />
            {submittingLabel}
          </>
        ) : (
          <>
            {submitLabel}
            <svg
              className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
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
