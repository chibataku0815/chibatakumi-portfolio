"use client";

import { useActionState } from "react";
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

  if (state.success) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--text-base-20)] bg-[var(--bg-darker)] px-8 py-16 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--text-base)]">
            {t("successTitle")}
          </h2>
          <p className="text-[var(--text-base-60)]">
            {t("successMessage")}
          </p>
          <p className="mt-2 text-[var(--text-base-30)]">
            {t("successSub")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--text-base-20)] bg-[var(--bg-darker)] px-8 py-16">
        <h2 className="mb-3 text-2xl font-semibold text-[var(--text-base)]">
          {t("heading")}
        </h2>
        <p className="mb-10 text-[var(--text-base-60)]">
          {t("subheading")}
        </p>

        {state.error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="source" value="photography" />
          <input type="hidden" name="locale" value={locale} />

          {/* Name + Email row */}
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
                className="w-full rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
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
                className="w-full rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
                placeholder={t("emailPlaceholder")}
              />
              {state.fieldErrors?.email && (
                <p className="mt-1 text-sm text-red-400">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          {/* Event Type */}
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
              className="w-full appearance-none rounded-lg border border-[var(--text-base-20)] bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat px-4 py-3 pr-10 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
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

          {/* Event Date */}
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
              className="w-full rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
            />
          </div>

          {/* Estimated Attendees */}
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
              className="w-full appearance-none rounded-lg border border-[var(--text-base-20)] bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat px-4 py-3 pr-10 text-[var(--text-base)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
            >
              <option value="">{t("attendeesPlaceholder")}</option>
              <option value="Under 50">{t("attendeesOptions.under50")}</option>
              <option value="50-100">{t("attendeesOptions.50-100")}</option>
              <option value="100-200">{t("attendeesOptions.100-200")}</option>
              <option value="200-500">{t("attendeesOptions.200-500")}</option>
              <option value="500+">{t("attendeesOptions.500+")}</option>
            </select>
          </div>

          {/* Additional Details */}
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
              rows={4}
              className="w-full resize-y rounded-lg border border-[var(--text-base-20)] bg-transparent px-4 py-3 text-[var(--text-base)] placeholder:text-[var(--text-base-30)] transition-colors focus:border-[var(--accent-amber1)] focus:outline-none"
              style={{ minHeight: "120px" }}
              placeholder={t("detailsPlaceholder")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--accent-amber1)] px-6 py-3 font-medium text-[var(--accent-amber1)] transition-colors hover:bg-[var(--accent-amber1)] hover:text-[var(--bg-darker)] disabled:opacity-50"
          >
            {isPending ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </section>
  );
}
