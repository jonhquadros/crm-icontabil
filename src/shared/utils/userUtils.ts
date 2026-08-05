/**
 * Formats a user ID, email, or raw author field into a clean, human-readable user display name.
 * Prevents displaying raw Firestore UIDs or system codes (e.g., 'de92964b-7674-429e-b588-c2b5d8da928d').
 */
export function getFormattedUserName(
  value: string | undefined | null,
  usersList?: { id?: string; name?: string; email?: string }[],
  currentUser?: { name?: string; email?: string; id?: string } | null
): string {
  if (!value || value === 'system' || value === 'user' || value === 'null' || value === 'undefined') {
    return 'Sistema';
  }

  const trimmed = value.trim();

  // If matches current logged-in user ID or email
  if (currentUser) {
    if (currentUser.id && trimmed === currentUser.id) {
      return currentUser.name || currentUser.email?.split('@')[0] || 'Administrador';
    }
    if (currentUser.email && trimmed.toLowerCase() === currentUser.email.toLowerCase()) {
      return currentUser.name || currentUser.email.split('@')[0] || 'Administrador';
    }
  }

  // If matches a user in the provided users list
  if (usersList && usersList.length > 0) {
    const found = usersList.find(u => 
      u.id === trimmed || 
      (u.email && u.email.toLowerCase() === trimmed.toLowerCase()) || 
      (u.name && u.name.toLowerCase() === trimmed.toLowerCase())
    );
    if (found && found.name) {
      return found.name;
    }
  }

  // Check if value is a raw Firestore UID/hash or system string (e.g. de92964b-7674-429e-b588-c2b5d8da928d, w4gxh2vk..., u1)
  const isFirestoreCode = /^[a-zA-Z0-9_-]{12,}$/.test(trimmed) || 
                          /^[0-9a-fA-F-]{10,}$/.test(trimmed) || 
                          /^u\d+$/.test(trimmed) ||
                          trimmed.startsWith('cli_') ||
                          trimmed.startsWith('usr_');

  if (isFirestoreCode) {
    if (currentUser?.name) {
      return currentUser.name;
    }
    return 'Administrador';
  }

  // If value is an email address
  if (trimmed.includes('@')) {
    const localPart = trimmed.split('@')[0].replace(/[._-]/g, ' ');
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  // Otherwise it's already a clean human name (e.g., "Carlos Silva")
  return trimmed;
}
