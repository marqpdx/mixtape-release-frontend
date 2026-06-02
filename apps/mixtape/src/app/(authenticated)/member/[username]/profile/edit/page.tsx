// 301 → new profile editor per profile-revamp CR-001 AD-PR-CR-1
import { permanentRedirect } from 'next/navigation';

export default function LegacyProfileEditRedirect() {
  permanentRedirect('/settings/profile/new');
}
