export interface MailHeaders {
  get(name: string): string | null;
}

export interface ShouldReplyResult {
  shouldReply: boolean;
  reason?: string;
}

const AUTO_REPLY_PRECEDENCE = new Set(['bulk', 'junk', 'list']);

export function shouldReply(headers: MailHeaders): ShouldReplyResult {
  const autoSubmitted = headers.get('auto-submitted');
  if (autoSubmitted !== null && autoSubmitted.trim().toLowerCase() !== 'no') {
    return { shouldReply: false, reason: `auto-submitted: ${autoSubmitted}` };
  }

  const precedence = headers.get('precedence');
  if (precedence !== null && AUTO_REPLY_PRECEDENCE.has(precedence.trim().toLowerCase())) {
    return { shouldReply: false, reason: `precedence: ${precedence}` };
  }

  if (headers.get('list-unsubscribe') !== null) {
    return { shouldReply: false, reason: 'list-unsubscribe' };
  }

  const suppress = headers.get('x-auto-response-suppress');
  if (suppress !== null && suppress.toLowerCase().includes('all')) {
    return { shouldReply: false, reason: `x-auto-response-suppress: ${suppress}` };
  }

  const from = headers.get('from');
  if (from === null || from.trim() === '') {
    return { shouldReply: false, reason: 'empty from (bounce / null sender)' };
  }

  return { shouldReply: true };
}
