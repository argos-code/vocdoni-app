import { render, screen, TestMemoryRouter } from '~src/test-utils'
import { AccountEdit } from './Edit'

vi.mock('~src/queries/account', () => ({
  useProfile: () => ({ data: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' } }),
}))

vi.mock('./Form', () => ({
  default: () => <div>Account Form</div>,
}))

vi.mock('~components/Layout/ColorModeSwitcher', () => ({
  ThemeToggleGroup: () => <div data-testid='theme-toggle-group'>Theme Toggle</div>,
}))

vi.mock('~components/Modal/DeleteModal', () => ({
  default: () => <div />,
}))

describe('AccountEdit', () => {
  it('renders the preferences section with a theme toggle', () => {
    render(
      <TestMemoryRouter>
        <AccountEdit />
      </TestMemoryRouter>
    )

    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle-group')).toBeInTheDocument()
  })
})
