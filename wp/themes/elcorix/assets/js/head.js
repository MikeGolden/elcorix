/*
 * Two lines that have to run before the first paint.
 *
 * The scroll-reveal start state (`opacity: 0`) is scoped to `.js` in the
 * stylesheet, so that a visitor without JavaScript — or a crawler — is
 * never shown a page of invisible sections. This is what puts that class
 * on, and it must happen in <head>: any later and the content would paint
 * and then disappear.
 *
 * Kept in its own file rather than inlined because the site's Content-
 * Security-Policy allows scripts from 'self' only, with no
 * 'unsafe-inline'.
 */
document.documentElement.classList.add("js");
