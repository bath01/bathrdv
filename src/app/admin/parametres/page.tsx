import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">Règles de réservation et informations affichées aux clients.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
