// Profile editor — /settings/profile/new
// Auth required. Full client component (interactive editor).
import ProfileEditor from '@/features/profile-revamp/editor/ProfileEditor';

export const metadata = { title: 'Edit Profile — Mixtape' };

export default function ProfileEditorPage() {
  return <ProfileEditor />;
}
