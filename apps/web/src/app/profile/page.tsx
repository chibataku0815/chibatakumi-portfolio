import { portfolioData } from "@/shared/data/portfolio";
import ProfileClient from "@/features/profile/ProfileClient";

export default function ProfilePage() {
  const profile = portfolioData.pages.profile;
  return <ProfileClient profile={profile} />;
}
