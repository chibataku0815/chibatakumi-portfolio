import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;
const CONTACT_EMAIL = portfolioData.pages.contact.email;

type Section = { heading: string; paragraphs?: string[]; items?: string[] };

type PolicyCopy = {
  title: string;
  description: string;
  updatedLabel: string;
  contactLabel: string;
  sections: Section[];
};

const UPDATED_AT = "2026-11-14";

const copy: Record<"ja" | "en", PolicyCopy> = {
  ja: {
    title: "プライバシーポリシー",
    description:
      "chibatakumi.studio と、個人用バックアップツール nas-archive-rclone のプライバシーポリシー。",
    updatedLabel: "最終更新日",
    contactLabel: "お問い合わせ",
    sections: [
      {
        heading: "1. 本サイト（chibatakumi.studio）について",
        paragraphs: [
          "本サイトは、運営者（千葉 拓海）の作品・制作情報を公開するサイトです。アカウント登録機能はありません。",
        ],
        items: [
          "アクセス解析: Vercel Web Analytics / Speed Insights により、ページの閲覧数や表示速度などの統計情報を取得します。設定によっては Google Analytics や Meta Pixel を有効にする場合があり、その場合はクッキー等を通じて閲覧情報が各社に送信されます。",
          "お問い合わせフォーム: フォームに入力いただいたお名前・メールアドレス・メッセージを、運営者への通知（Slack）として送信します。返信と対応の目的にのみ使用し、第三者へ提供・販売しません。",
          "ホスティング事業者（Vercel）は、運用上の標準的なサーバーアクセスログ（IP アドレス、ブラウザ情報など）を記録することがあります。",
        ],
      },
      {
        heading: "2. アプリ「nas-archive-rclone」について",
        paragraphs: [
          "nas-archive-rclone は、運営者本人のみが運営・利用する個人用ツールです。運営者自身の自宅 NAS にあるファイルを、運営者自身の Google ドライブへバックアップする目的でのみ使用します。一般公開や第三者への提供は行いません。",
        ],
        items: [
          "取得する権限: Google ドライブの drive.file スコープのみを要求します。これは、アプリ自身が作成したファイルにのみアクセスできる範囲です。",
          "データの保管場所: ファイルとそのメタデータは、運営者自身の Google ドライブおよび運営者自身の端末内にのみ保管されます。",
          "第三者との関係: Google ユーザーデータを第三者に共有・販売・移転することはありません。広告目的での利用もしません。",
          "利用目的: Google ユーザーデータは、バックアップおよび復元機能を提供する目的にのみ使用します。Google API Services User Data Policy（Limited Use 要件を含む）に準拠します。",
          "削除: 運営者は、Google ドライブ上のファイルを削除し、Google アカウントの設定でアプリのアクセス権を取り消すことで、いつでもデータを削除・利用停止できます。",
        ],
      },
      {
        heading: "3. 変更について",
        paragraphs: [
          "本ポリシーは必要に応じて改定することがあります。改定後は本ページに掲載し、最終更新日を更新します。",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    description:
      "Privacy policy for chibatakumi.studio and the personal backup tool nas-archive-rclone.",
    updatedLabel: "Last updated",
    contactLabel: "Contact",
    sections: [
      {
        heading: "1. This site (chibatakumi.studio)",
        paragraphs: [
          "This site presents the work of its owner (Takumi Chiba). It has no account registration.",
        ],
        items: [
          "Analytics: Vercel Web Analytics and Speed Insights collect aggregate statistics such as page views and loading performance. Depending on configuration, Google Analytics or Meta Pixel may also be enabled; in that case browsing information is sent to those providers via cookies or similar technologies.",
          "Contact form: the name, email address and message you enter are forwarded to the site owner as a Slack notification. They are used only to reply and follow up, and are never sold or provided to third parties.",
          "The hosting provider (Vercel) may record standard server access logs (such as IP address and browser information) as part of normal operation.",
        ],
      },
      {
        heading: "2. The app “nas-archive-rclone”",
        paragraphs: [
          "nas-archive-rclone is a personal tool operated and used only by the site owner. It is used solely to back up the owner’s own files from the owner’s home NAS to the owner’s own Google Drive. It is not offered to the public or to third parties.",
        ],
        items: [
          "Access requested: only the Google Drive drive.file scope, which is limited to files the app itself creates.",
          "Where data lives: the files and their metadata stay in the owner’s own Google Drive and on the owner’s own devices.",
          "Third parties: Google user data is not shared with, sold to, or transferred to third parties, and is not used for advertising.",
          "Purpose: Google user data is used only to provide the backup and restore function. The app’s use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
          "Deletion: the owner can delete the data at any time by deleting the files in Google Drive and revoking the app’s access in the Google account settings.",
        ],
      },
      {
        heading: "3. Changes",
        paragraphs: [
          "This policy may be updated as needed. Changes will be posted on this page together with a new last-updated date.",
        ],
      },
    ],
  },
};

function resolveCopy(locale: string): PolicyCopy {
  return locale === "ja" ? copy.ja : copy.en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = resolveCopy(locale);
  const canonicalUrl = locale === "ja" ? `${BASE_URL}/privacy` : `${BASE_URL}/en/privacy`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/privacy`,
        en: `${BASE_URL}/en/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { title, updatedLabel, contactLabel, sections } = resolveCopy(locale);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      <p className="mt-3 text-sm text-white/60">
        {updatedLabel}: {UPDATED_AT}
      </p>

      {sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-lg font-semibold text-white sm:text-xl">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-relaxed text-white/75">
              {paragraph}
            </p>
          ))}
          {section.items ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/75">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{contactLabel}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
