import { SkillsClient } from "@/features/skills";
import { portfolioData } from "@/shared/data/portfolio";

export default function SkillsPage() {
  return <SkillsClient skills={portfolioData.skills.items} />;
}
