/**
 * Lightweight HTML sanitizer for CMS content (Directus descriptions).
 * Allows safe formatting tags, strips everything else (scripts, event handlers, etc).
 *
 * Two modes:
 * - sanitizeHtml(): Strict mode for product/category descriptions (no iframes, no embeds)
 * - sanitizeBlogHtml(): Extended mode for blog WYSIWYG content (allows YouTube/Vimeo iframes, video, figure)
 */

// ─── Base Configuration ───

// Tags allowed in product/category descriptions from Directus WYSIWYG
const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "blockquote", "pre", "code",
  "span", "div", "sub", "sup", "hr",
]);

// Attributes allowed per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

// Attributes allowed on ALL tags
const GLOBAL_ATTRS = new Set(["class", "id"]);

// ─── Blog-Extended Configuration ───

const BLOG_ALLOWED_TAGS = new Set([
  ...ALLOWED_TAGS,
  "iframe", "figure", "figcaption", "video", "source",
]);

const BLOG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  ...ALLOWED_ATTRS,
  iframe: new Set(["src", "width", "height", "allowfullscreen", "allow", "title", "loading"]),
  video: new Set(["src", "width", "height", "controls", "autoplay", "muted", "loop", "poster"]),
  source: new Set(["src", "type"]),
  figure: new Set(["class"]),
  figcaption: new Set(["class"]),
};

// Trusted domains for iframe src validation
const TRUSTED_IFRAME_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
];

// ─── Core Sanitization Engine ───

/**
 * Internal sanitizer used by both sanitizeHtml and sanitizeBlogHtml.
 * Strips dangerous tags/attributes, validates iframe domains when applicable.
 */
function _sanitize(
  dirty: string,
  allowedTags: Set<string>,
  allowedAttrs: Record<string, Set<string>>,
  iframeDomains?: string[],
): string {
  if (!dirty) return "";

  // Tags to strip completely (content and all) — always dangerous
  const stripWithContent = ["script", "style", "object", "form"];

  // For non-blog mode, iframe is also stripped with content.
  // For blog mode, iframe is allowed (validated by domain later).
  if (!allowedTags.has("iframe")) {
    stripWithContent.push("iframe");
  }

  let clean = dirty;
  for (const tag of stripWithContent) {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(regex, "");
  }

  // Always strip these self-closing/void dangerous tags
  clean = clean
    .replace(/<embed\b[^>]*\/?>/gi, "")
    .replace(/<input\b[^>]*\/?>/gi, "")
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, "")
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, "")
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "");

  // Process remaining tags
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase() as string;

    // Remove disallowed tags entirely (opening and closing)
    if (!allowedTags.has(tagLower)) {
      return "";
    }

    // Closing tag - just return it clean
    if (match.startsWith("</")) {
      return `</${tagLower}>`;
    }

    // Filter attributes
    const allowedForTag = allowedAttrs[tagLower] || new Set<string>();
    const cleanAttrs: string[] = [];

    // Parse attributes
    const attrRegex = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      // Skip event handlers
      if (attrName.startsWith("on")) continue;

      // Skip dangerous URL protocols
      if ((attrName === "href" || attrName === "src") &&
        /^\s*(javascript|data|vbscript):/i.test(attrValue)) {
        continue;
      }

      // Only allow permitted attributes
      if (allowedForTag.has(attrName) || GLOBAL_ATTRS.has(attrName)) {
        cleanAttrs.push(`${attrName}="${attrValue.replace(/"/g, "&quot;")}"`);
      }
    }

    // Force rel="noopener noreferrer" on links with target
    if (tagLower === "a") {
      const hasTarget = cleanAttrs.some(a => a.startsWith("target="));
      if (hasTarget) {
        // Remove existing rel and add safe one
        const filtered = cleanAttrs.filter(a => !a.startsWith("rel="));
        filtered.push('rel="noopener noreferrer"');
        return `<a ${filtered.join(" ")}>`;
      }
    }

    // Validate iframe src against trusted domains
    if (tagLower === "iframe" && iframeDomains) {
      const srcAttr = cleanAttrs.find(a => a.startsWith("src="));
      if (srcAttr) {
        // Extract URL from src="..."
        const srcMatch = srcAttr.match(/^src="([^"]*)"/);
        const srcUrl = srcMatch ? srcMatch[1] : "";
        try {
          const url = new URL(srcUrl);
          const hostname = url.hostname.toLowerCase();
          if (!iframeDomains.some(domain => hostname === domain)) {
            return ""; // Strip iframe with untrusted domain
          }
        } catch {
          return ""; // Strip iframe with invalid URL
        }
      } else {
        return ""; // Strip iframe without src
      }
    }

    const selfClosing = match.endsWith("/>") ? " /" : "";
    const attrStr = cleanAttrs.length > 0 ? ` ${cleanAttrs.join(" ")}` : "";
    return `<${tagLower}${attrStr}${selfClosing}>`;
  });

  return clean;
}

// ─── Public API ───

/**
 * Sanitize HTML string by removing disallowed tags and attributes.
 * Strips all event handlers (on*), javascript: URLs, and dangerous tags.
 * For product/category descriptions — strict mode (no iframes, no embeds).
 */
export function sanitizeHtml(dirty: string): string {
  return _sanitize(dirty, ALLOWED_TAGS, ALLOWED_ATTRS);
}

/**
 * Sanitize blog WYSIWYG HTML content.
 * Extended mode: allows iframe (YouTube/Vimeo only), video, figure/figcaption.
 * Validates iframe src against trusted domains — strips untrusted iframes.
 */
export function sanitizeBlogHtml(dirty: string): string {
  return _sanitize(dirty, BLOG_ALLOWED_TAGS, BLOG_ALLOWED_ATTRS, TRUSTED_IFRAME_DOMAINS);
}
