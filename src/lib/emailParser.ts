import { convert, type HtmlToTextOptions } from "html-to-text";

const HTML_TO_TEXT_OPTIONS: HtmlToTextOptions = {
  wordwrap: false as const,
  selectors: [
    { selector: "img", format: "skip" },
    { selector: "style", format: "skip" },
    { selector: "script", format: "skip" },
    { selector: "a", options: { ignoreHref: true } },
    { selector: "h1", options: { uppercase: false } },
    { selector: "h2", options: { uppercase: false } },
    { selector: "h3", options: { uppercase: false } },
  ],
};

const FORWARDING_HEADER_PATTERNS = [
  /^-{5,}\s*Forwarded message\s*-{5,}$/m,
  /^From:.*\nSent:.*\nTo:.*\nSubject:.*/m,
  /^Begin forwarded message:$/m,
];

const BOILERPLATE_PATTERNS = [
  /unsubscribe/i,
  /view\s+(this\s+)?(email\s+)?in\s+(your\s+)?browser/i,
  /manage\s+(your\s+)?(email\s+)?preferences/i,
  /you('re| are)\s+receiving\s+this/i,
  /\d+\s+\w+\s+(street|st|ave|avenue|blvd|boulevard),?\s+\w+/i,
  /©\s*\d{4}/,
  /all\s+rights\s+reserved/i,
];

export function extractNewsletterContent(html: string): string {
  let text = convert(html, HTML_TO_TEXT_OPTIONS);
  text = stripForwardingHeaders(text);
  text = stripBoilerplate(text);
  text = cleanWhitespace(text);
  return text.trim();
}

export function stripForwardingHeaders(text: string): string {
  for (const pattern of FORWARDING_HEADER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      // Find the end of the forwarding header block (next blank line)
      const afterMatch = text.slice(match.index + match[0].length);
      const blankLineIdx = afterMatch.search(/\n\s*\n/);
      if (blankLineIdx !== -1) {
        text = text.slice(0, match.index) + afterMatch.slice(blankLineIdx);
      }
    }
  }
  return text;
}

export function stripBoilerplate(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let consecutiveBoilerplate = 0;

  for (const line of lines) {
    const isBoilerplate = BOILERPLATE_PATTERNS.some((p) => p.test(line));
    if (isBoilerplate) {
      consecutiveBoilerplate++;
      // Once we hit boilerplate near the end, skip remaining lines
      if (consecutiveBoilerplate >= 2) {
        // Check if we're in the footer region (last 20% of content)
        const progress = result.length / lines.length;
        if (progress > 0.7) {
          break;
        }
      }
      continue;
    }
    consecutiveBoilerplate = 0;
    result.push(line);
  }

  return result.join("\n");
}

function cleanWhitespace(text: string): string {
  // Collapse 3+ newlines into 2
  return text.replace(/\n{3,}/g, "\n\n");
}

export interface ParsedEmail {
  sender: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export function parseInboundEmail(payload: Record<string, unknown>): ParsedEmail {
  return {
    sender: String(payload.from || payload.sender || "Unknown"),
    subject: String(payload.subject || "No subject"),
    htmlBody: String(payload.html || payload.html_body || ""),
    textBody: String(payload.text || payload.text_body || payload.plain || ""),
  };
}
