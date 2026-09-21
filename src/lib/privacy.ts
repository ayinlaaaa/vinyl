/**
 * Visibility rules for recaps and listener profiles.
 *
 * - A recap is visible when it is public, or when the viewer owns it.
 * - A profile is visible when it is public and has a handle, or when the viewer owns it.
 * - Making a profile private never un-publishes individual recaps: those stay reachable
 *   by direct link until the owner turns each one private.
 */

export function canViewRecap(
  recap: { isPublic: boolean; userId: string },
  viewerId: string | null,
): boolean {
  return recap.isPublic || (viewerId !== null && recap.userId === viewerId);
}

export function canViewProfile(
  profile: { profilePublic: boolean; handle: string | null },
  ownerId: string,
  viewerId: string | null,
): boolean {
  if (viewerId !== null && viewerId === ownerId) return true;
  return profile.profilePublic && Boolean(profile.handle);
}

/** True when the owner is looking at their own still-private profile (preview mode). */
export function isProfilePreview(
  profile: { profilePublic: boolean; handle: string | null },
  ownerId: string,
  viewerId: string | null,
): boolean {
  return viewerId === ownerId && (!profile.profilePublic || !profile.handle);
}
