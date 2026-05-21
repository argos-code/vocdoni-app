import { sanitizeUrl } from './sanitize'

// AC1 (<img src=x onerror=alert(1)>) and AC2 (<script>alert(1)</script>) are covered
// by react-markdown's default HTML stripping behaviour (no rehype-raw). Those vectors
// never reach a URL-transform stage; they are tested at the Markdown component level.

describe('sanitizeUrl', () => {
  describe('blocks dangerous URI schemes (AC3, AC4)', () => {
    it('strips javascript: URIs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    })

    it('strips javascript: URIs case-insensitively', () => {
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('')
      expect(sanitizeUrl('JavaScript:alert(document.cookie)')).toBe('')
    })

    it('strips javascript: URIs with encoded colon', () => {
      expect(sanitizeUrl('javascript&#58;alert(1)')).toBe('')
    })

    it('strips data: URIs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    })

    it('strips data: URIs case-insensitively', () => {
      expect(sanitizeUrl('DATA:text/html,<script>alert(1)</script>')).toBe('')
    })

    it('strips vbscript: URIs', () => {
      expect(sanitizeUrl('vbscript:MsgBox(1)')).toBe('')
    })
  })

  describe('allows safe URIs (AC5)', () => {
    it('allows https: URLs', () => {
      expect(sanitizeUrl('https://vocdoni.io')).toBe('https://vocdoni.io')
    })

    it('allows http: URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('allows relative URLs', () => {
      expect(sanitizeUrl('/about')).toBe('/about')
      expect(sanitizeUrl('./page')).toBe('./page')
      expect(sanitizeUrl('#anchor')).toBe('#anchor')
    })

    it('allows mailto: URLs', () => {
      expect(sanitizeUrl('mailto:hello@example.com')).toBe('mailto:hello@example.com')
    })

    it('allows empty string', () => {
      expect(sanitizeUrl('')).toBe('')
    })
  })
})
