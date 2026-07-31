import { describe, it, expect } from 'vitest';
import { decodeEncodedWords } from '../src/encodedWords';

describe('decodeEncodedWords', () => {
  it('decodes base64 encoded words (UTF-8)', () => {
    const input = '=?UTF-8?B?W1VSR0VOVF0g5a+5IENsb3VkRmxhcmUgV29ya2VycyDlt6XkvZzmtYHnmoTnlpHpl64=?=';
    expect(decodeEncodedWords(input)).toBe('[URGENT] 对 CloudFlare Workers 工作流的疑问');
  });

  it('decodes quoted-printable encoded words', () => {
    expect(decodeEncodedWords('=?UTF-8?Q?=E5=AF=B9_CloudFlare?=')).toBe('对 CloudFlare');
  });

  it('joins adjacent encoded words separated by whitespace', () => {
    expect(decodeEncodedWords('=?UTF-8?B?5a+5?= =?UTF-8?B?IA==?=')).toBe('对 ');
  });

  it('passes through plain text unchanged', () => {
    expect(decodeEncodedWords('Hello world')).toBe('Hello world');
  });

  it('decodes encoded words mixed with plain text', () => {
    expect(decodeEncodedWords('Hi =?UTF-8?Q?=E4=BD=A0?=')).toBe('Hi 你');
  });

  it('keeps the original text when decoding fails', () => {
    const input = '=?UTF-8?B?!!!not-base64!!!?=';
    expect(decodeEncodedWords(input)).toBe(input);
  });
});
