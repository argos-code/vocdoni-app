import { render, screen, TestMemoryRouter } from '~src/test-utils'
import { setReactProvidersMock, resetReactProvidersMock } from '~src/test-utils-react-providers-mock'
import Votings from './Votings'

vi.mock('@vocdoni/react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vocdoni/react-components')>()
  const { getReactProvidersMock } = await import('~src/test-utils-react-providers-mock')
  return {
    ...actual,
    ...getReactProvidersMock(),
  }
})

const emptyData = {
  elections: [],
  pagination: { totalItems: 0, currentPage: 1, lastPage: 1, previousPage: null, nextPage: null },
}

describe('Votings', () => {
  afterEach(() => {
    resetReactProvidersMock()
  })

  it('shows the skeleton while the organization is loading', () => {
    setReactProvidersMock({
      useOrganization: () => ({ loading: true, organization: null }),
    })

    render(
      <TestMemoryRouter>
        <Votings path='/admin/processes/all/:page' data={emptyData as any} />
      </TestMemoryRouter>
    )

    expect(screen.getByTestId('process-list-skeleton')).toBeInTheDocument()
  })

  it('renders nothing when organization is absent after loading', () => {
    setReactProvidersMock({
      useOrganization: () => ({ loading: false, organization: null }),
    })

    render(
      <TestMemoryRouter>
        <Votings path='/admin/processes/all/:page' data={emptyData as any} />
      </TestMemoryRouter>
    )

    expect(screen.queryByTestId('process-list-skeleton')).not.toBeInTheDocument()
  })

  it('does not show the skeleton when the organization has loaded', () => {
    setReactProvidersMock({
      useOrganization: () => ({ loading: false, organization: { address: '0xorg' } }),
    })

    render(
      <TestMemoryRouter>
        <Votings path='/admin/processes/all/:page' data={emptyData as any} />
      </TestMemoryRouter>
    )

    expect(screen.queryByTestId('process-list-skeleton')).not.toBeInTheDocument()
  })
})
