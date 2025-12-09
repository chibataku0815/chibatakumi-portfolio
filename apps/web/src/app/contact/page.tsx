import { portfolioData } from "@/shared/data/portfolio";
import { ContactClient } from "@/features/contact";

export default function ContactPage() {
  const contact = portfolioData.pages.contact;

  return <ContactClient contact={contact} />;
}
