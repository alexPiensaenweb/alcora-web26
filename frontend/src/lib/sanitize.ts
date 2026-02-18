/**
 * Lightweight HTML sanitizer for CMS content (Directus descriptions).
 * Allows safe formatting tags, strips everything else (scripts, event handlers, etc).
 */

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

/**
 * Sanitize HTML string by removing disallowed tags and attributes.
 * Strips all event handlers (on*), javascript: URLs, and dangerous tags.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  // Remove script/style/iframe/object/embed tags and their content
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*\/?>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<input\b[^>]*\/?>/gi, "")
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, "")
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, "")
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "");

  // Process remaining tags
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase();

    // Remove disallowed tags entirely (opening and closing)
    if (!ALLOWED_TAGS.has(tagLower)) {
      return "";
    }

    // Closing tag - just return it clean
    if (match.startsWith("</")) {
      return `</${tagLower}>`;
    }

    // Filter attributes
    const allowedForTag = ALLOWED_ATTRS[tagLower] || new Set();
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

    const selfClosing = match.endsWith("/>") ? " /" : "";
    const attrStr = cleanAttrs.length > 0 ? ` ${cleanAttrs.join(" ")}` : "";
    return `<${tagLower}${attrStr}${selfClosing}>`;
  });

  return clean;
}
