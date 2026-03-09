"use client";

import { useActionState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  submitPhotographyInquiry,
  type PhotographyFormState,
} from "@/features/photography/actions";

const initialState: PhotographyFormState = {
  success: false,
};

export function CTAFormSection() {
  const t = useTranslations("photography.form");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    submitPhotographyInquiry,
    initialState
  );

  const notes = useMemo(
    () => ["reply", "deliverables", "eventScope"] as const,
    []
  );

  if (state.success) {
    return (
      <section className="px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_88%,transparent),color-mix(in_srgb,var(--slate-1)_76%,transparent))] px-8 py-14 text-center sm:px-12">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
            {t("eyebrow")}
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
            {t("successTitle")}
          </h2>
          <p className="mt-4 text-base text-[var(--text-base-60)]">
            {t("successMessage")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-base-40)] sm:text-base">
            {t("successSub")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.2rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_90%,transparent),color-mix(in_srgb,var(--slate-1)_80%,transparent))] lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
        <div className="relative border-b border-[var(--text-base-20)] p-8 sm:p-10 lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,196,61,0.14),transparent_34%)]" />
          <div className="relative z-10">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
              {t("eyebrow")}
            </p>
            <h2 className="text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[0.97] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
              {t("heading")}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              {t("subheading")}
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_68%,transparent)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("asideTitle")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-base-60)]">
                {t("asideBody")}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {notes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.4rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_60%,transparent)] p-5"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                    {t(`notes.${note}Title`)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-base)]">
                    {t(`notes.${note}Body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {state.error && (
            <div className="mb-6 rounded-[1.2rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="source" value="photography" />
            <input type="hidden" name="locale" value={locale} />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
                >
                  {t("nameLabel")} <span className="text-[var(--accent-amber1)]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                  placeholder={t("namePlaceholder")}
                />
                {state.fieldErrors?.name && (
                  <p className="mt-1 text-sm text-red-400">
                    {state.fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
                >
                  {t("emailLabel")} <span className="text-[var(--accent-amber1)]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                  placeholder={t("emailPlaceholder")}
                />
                {state.fieldErrors?.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {state.fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="eventType"
                  className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
                >
                  {t("eventTypeLabel")} <span className="text-[var(--accent-amber1)]">*</span>
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat px-4 py-3 pr-10 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                >
                  <option value="" disabled>
                    {t("eventTypePlaceholder")}
                  </option>
                  <option value="Tech Meetup">{t("eventTypeOptions.techMeetup")}</option>
                  <option value="Corporate Event">{t("eventTypeOptions.corporateEvent")}</option>
                  <option value="Conference">{t("eventTypeOptions.conference")}</option>
                  <option value="Community Gathering">{t("eventTypeOptions.communityGathering")}</option>
                  <option value="Other">{t("eventTypeOptions.other")}</option>
                </select>
                {state.fieldErrors?.eventType && (
                  <p className="mt-1 text-sm text-red-400">
                    {state.fieldErrors.eventType}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="eventDate"
                  className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
                >
                  {t("eventDateLabel")}
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  className="w-full rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] px-4 py-3 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="attendees"
                className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
              >
                {t("attendeesLabel")}
              </label>
              <select
                id="attendees"
                name="attendees"
                defaultValue=""
                className="w-full appearance-none rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat px-4 py-3 pr-10 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
              >
                <option value="">{t("attendeesPlaceholder")}</option>
                <option value="Under 50">{t("attendeesOptions.under50")}</option>
                <option value="50-100">{t("attendeesOptions.50-100")}</option>
                <option value="100-200">{t("attendeesOptions.100-200")}</option>
                <option value="200-500">{t("attendeesOptions.200-500")}</option>
                <option value="500+">{t("attendeesOptions.500+")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="details"
                className="mb-2 block text-sm font-medium text-[var(--text-base-60)]"
              >
                {t("detailsLabel")}
              </label>
              <textarea
                id="details"
                name="details"
                rows={5}
                className="w-full resize-y rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                style={{ minHeight: "160px" }}
                placeholder={t("detailsPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full border border-[var(--accent-amber1)] bg-[color-mix(in_srgb,var(--accent-amber1)_10%,transparent)] px-6 py-3 font-medium text-[var(--text-base)] transition-colors hover:bg-[var(--accent-amber1)] hover:text-[var(--bg-darker)] disabled:opacity-50"
            >
              {isPending ? t("submitting") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
