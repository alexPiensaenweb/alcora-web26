const ALLOWED_TAGS = /* @__PURE__ */ new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "del",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
  "pre",
  "code",
  "span",
  "div",
  "sub",
  "sup",
  "hr"
]);
const ALLOWED_ATTRS = {
  a: /* @__PURE__ */ new Set(["href", "title", "target", "rel"]),
  img: /* @__PURE__ */ new Set(["src", "alt", "width", "height", "loading"]),
  td: /* @__PURE__ */ new Set(["colspan", "rowspan"]),
  th: /* @__PURE__ */ new Set(["colspan", "rowspan"])
};
const GLOBAL_ATTRS = /* @__PURE__ */ new Set(["class", "id"]);
function sanitizeHtml(dirty) {
  if (!dirty) return "";
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "").replace(/<embed\b[^>]*\/?>/gi, "").replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "").replace(/<input\b[^>]*\/?>/gi, "").replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, "").replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, "").replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "");
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagLower)) {
      return "";
    }
    if (match.startsWith("</")) {
      return `</${tagLower}>`;
    }
    const allowedForTag = ALLOWED_ATTRS[tagLower] || /* @__PURE__ */ new Set();
    const cleanAttrs = [];
    const attrRegex = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
      if (attrName.startsWith("on")) continue;
      if ((attrName === "href" || attrName === "src") && /^\s*(javascript|data|vbscript):/i.test(attrValue)) {
        continue;
      }
      if (allowedForTag.has(attrName) || GLOBAL_ATTRS.has(attrName)) {
        cleanAttrs.push(`${attrName}="${attrValue.replace(/"/g, "&quot;")}"`);
      }
    }
    if (tagLower === "a") {
      const hasTarget = cleanAttrs.some((a) => a.startsWith("target="));
      if (hasTarget) {
        const filtered = cleanAttrs.filter((a) => !a.startsWith("rel="));
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

export { sanitizeHtml as s };
