export function rentalListPath(source: unknown) {
  return source === 'property-management' ? '/house/property-management' : '/house/rent';
}
export function activeMenuPath(path: string, source?: unknown) {
  return /^\/house\/rent\/(detail|edit)\//.test(path) ? rentalListPath(source) : path;
}
