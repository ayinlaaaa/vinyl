import LastfmConnection from "./LastfmConnection";
import SpotifyConnection from "./SpotifyConnection";
import AppleMusicConnection from "./AppleMusicConnection";
import ImportSection from "./ImportSection";
import DangerZone from "./DangerZone";
import TimezoneSettings from "./TimezoneSettings";
import PrivacySettings from "./PrivacySettings";
import { db } from "@/db";
import { musicProviders } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { isGuestEmail } from "@/lib/auth/guest";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const user = await requireUser();

  const providers = await db.query.musicProviders.findMany({
    where: eq(musicProviders.userId, user.id),
  });

  const lastfmProvider = providers.find((p) => p.provider === "lastfm");
  const spotifyProvider = providers.find((p) => p.provider === "spotify");
  const appleProvider = providers.find((p) => p.provider === "apple");

  const lastfmStatus = {
    isConnected: lastfmProvider?.isConnected || false,
    username: lastfmProvider?.providerUserId,
    lastSynced: lastfmProvider?.lastSyncedAt,
  };

  const spotifyStatus = {
    isConnected: spotifyProvider?.isConnected || false,
    lastSynced: spotifyProvider?.lastSyncedAt,
  };

  const appleStatus = {
    isConnected: appleProvider?.isConnected || false,
    lastSynced: appleProvider?.lastSyncedAt,
  };

  return (
    <div className="p-6 md:p-12 space-y-12 max-w-3xl mx-auto">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">System Settings</p>
        <h1 className="text-4xl md:text-5xl font-playfair font-bold">Data Management</h1>
      </div>

      <div className="space-y-8">
        <PrivacySettings
          initialName={user.name}
          initialHandle={user.handle}
          initialProfilePublic={user.profilePublic}
          initialRecapsPublicByDefault={user.recapsPublicByDefault}
        />
        <TimezoneSettings initialTimezone={user.timezone} />
        <SpotifyConnection initialStatus={spotifyStatus} />
        <AppleMusicConnection initialStatus={appleStatus} />
        <LastfmConnection initialStatus={lastfmStatus} />
        <ImportSection />
        <DangerZone isGuest={isGuestEmail(user.email)} />
      </div>
    </div>
  );
}
