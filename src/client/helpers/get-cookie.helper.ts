/**
 * @description
 * Get a cookie from the local machine
 *
 * @see https://www.w3schools.com/js/js_cookies.asp
 *
 * @param cookieName
 */
export function getCookie(cookieName: string): string {
  const name = `${cookieName}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
