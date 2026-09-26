export function getActivePathname() {
  return location.hash.replace('#', '') || '/';
}

export function getActiveRoute() {
  return getActivePathname();
}
