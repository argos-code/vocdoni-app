// Tests for XSS prevention in process description rendering.
// The actual render site is src/components/ui/Markdown.tsx (used by ElectionDescription
// in src/theme/react-components/election.tsx). This file should live at
// src/components/ui/Markdown.test.tsx once the path is corrected.

import { render, screen } from '~src/test-utils'
import { Markdown } from '~components/ui/Markdown'

describe('process description — XSS prevention', () => {
  describe('AC1/AC2: raw HTML injection is stripped', () => {
    it('does not render img element carrying onerror handler', () => {
      const { container } = render(<Markdown>{'<img src=x onerror=alert(1)>'}</Markdown>)
      expect(container.querySelector('img[onerror]')).toBeNull()
    })

    it('does not render injected script element', () => {
      const { container } = render(<Markdown>{'<script>alert(1)</script>'}</Markdown>)
      // ColorModeProvider injects a theme-preference script into the tree;
      // we only care that no script containing the XSS payload was rendered.
      const scripts = Array.from(container.querySelectorAll('script'))
      expect(scripts.every((s) => !s.textContent?.includes('alert(1)'))).toBe(true)
    })
  })

  describe('AC3: javascript: URIs in Markdown links are neutralised', () => {
    it('does not forward javascript: scheme to the link href', () => {
      render(<Markdown>{'[malicious](javascript:alert(document.cookie))'}</Markdown>)
      const link = screen.getByRole('link', { name: 'malicious' })
      expect(link).not.toHaveAttribute('href', 'javascript:alert(document.cookie)')
      expect(link.getAttribute('href')).not.toMatch(/alert/)
    })

    it('does not forward uppercase JAVASCRIPT: scheme', () => {
      render(<Markdown>{'[malicious](JAVASCRIPT:alert(1))'}</Markdown>)
      const link = screen.getByRole('link', { name: 'malicious' })
      expect(link.getAttribute('href')).not.toMatch(/alert/)
    })
  })

  describe('AC4: data: URIs in Markdown links are neutralised', () => {
    it('does not forward data: scheme to the link href', () => {
      render(<Markdown>{'[malicious](data:text/html,<script>alert(1)</script>)'}</Markdown>)
      const link = screen.getByRole('link', { name: 'malicious' })
      expect(link.getAttribute('href')).not.toMatch(/^data:/)
    })
  })

  describe('AC5: benign Markdown content renders correctly', () => {
    it('renders bold text', () => {
      render(<Markdown>{'**important**'}</Markdown>)
      expect(screen.getByText('important')).toBeInTheDocument()
    })

    it('renders italic text', () => {
      render(<Markdown>{'_emphasis_'}</Markdown>)
      expect(screen.getByText('emphasis')).toBeInTheDocument()
    })

    it('renders https links with their original href', () => {
      render(<Markdown>{'[vocdoni](https://vocdoni.io)'}</Markdown>)
      const link = screen.getByRole('link', { name: 'vocdoni' })
      expect(link).toHaveAttribute('href', 'https://vocdoni.io')
    })

    it('opens links in a new tab', () => {
      render(<Markdown>{'[link](https://example.com)'}</Markdown>)
      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
    })
  })
})
