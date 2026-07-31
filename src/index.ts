import { shouldReply } from './shouldReply';
import { renderReply, DEFAULT_TEXT_TEMPLATE, ReplyTemplates } from './reply';
import { decodeEncodedWords } from './encodedWords';
import htmlTemplate from '../REPLY/REPLY_HTML.txt';

export interface Env {
  REPLY_ADDRESS?: string;
  REPLY_FROM_NAME?: string;
  REPLY_SUBJECT?: string;
  REPLY_TEXT?: string;
  REPLY_HTML?: string;
}

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const expectedTo = (env.REPLY_ADDRESS ?? '').trim().toLowerCase();
    const to = message.to.trim().toLowerCase();
    if (expectedTo !== '' && to !== expectedTo) {
      console.log(`skip reply: unexpected recipient ${message.to} (expected ${env.REPLY_ADDRESS})`);
      return;
    }

    const verdict = shouldReply(message.headers);
    if (!verdict.shouldReply) {
      console.log(`skip reply: ${verdict.reason}`);
      return;
    }

    const originalSubject = decodeEncodedWords(message.headers.get('subject')?.trim() ?? '');
    const from = message.from;
    const subjectTemplate = env.REPLY_SUBJECT ?? 'Re: {{subject}}';
    const subject =
      originalSubject === '' ? 'Auto-reply' : subjectTemplate.replaceAll('{{subject}}', originalSubject);

    const templates: ReplyTemplates = {
      text: env.REPLY_TEXT ?? DEFAULT_TEXT_TEMPLATE,
      html: env.REPLY_HTML ?? htmlTemplate,
    };
    const { text, html } = renderReply(templates, { subject: originalSubject, from });

    await message.reply({
      from: {
        name: env.REPLY_FROM_NAME ?? 'Auto Reply',
        email: message.to,
      },
      subject,
      text,
      html,
    });
    console.log(`replied to ${from} for "${subject}"`);
  },
} satisfies ExportedHandler<Env>;
