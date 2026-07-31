export interface ReplyContext {
  subject: string;
  from: string;
}

export interface ReplyTemplates {
  text: string;
  html: string;
}

export const DEFAULT_TEXT_TEMPLATE = `Hello {{from}},

Thank you for your email. I have received your message
"{{subject}}" and will get back to you as soon as possible.

Best regards`;

export const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <p>Hello <strong>{{from}}</strong>,</p>
  <p>Thank you for your email. I have received your message
     &ldquo;<em>{{subject}}</em>&rdquo; and will get back to you as soon as possible.</p>
  <p>Best regards</p>
</body>
</html>`;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(template: string, ctx: ReplyContext, html: boolean): string {
  return template
    .replaceAll('{{subject}}', html ? escapeHtml(ctx.subject) : ctx.subject)
    .replaceAll('{{from}}', html ? escapeHtml(ctx.from) : ctx.from);
}

export function renderReply(
  templates: ReplyTemplates,
  ctx: ReplyContext
): { text: string; html: string } {
  return {
    text: render(templates.text, ctx, false),
    html: render(templates.html, ctx, true),
  };
}
