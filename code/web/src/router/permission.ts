export type PermissionRequirement = string | string[] | undefined;

export function hasPermission(
  permissions: readonly string[],
  requirement: PermissionRequirement,
): boolean {
  if (!requirement) return true;
  const required = Array.isArray(requirement) ? requirement : [requirement];
  if (required.length === 0) return true;
  return permissions.includes('*') || required.some((code) => permissions.includes(code));
}

export function canAccessRoute(
  permissions: readonly string[],
  menuPermission: PermissionRequirement,
  actionPermission?: PermissionRequirement,
): boolean {
  return hasPermission(permissions, menuPermission)
    && hasPermission(permissions, actionPermission);
}
