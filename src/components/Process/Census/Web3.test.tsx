import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { render, screen, waitFor } from '~src/test-utils'
import { CensusWeb3Addresses } from './Web3'

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

vi.mock('~components/Auth/Subscription', () => ({
  useSubscription: () => ({
    subscription: {
      subscriptionDetails: { maxCensusSize: 1000 },
      plan: { organization: { maxCensus: 1000 } },
    },
  }),
}))

const Wrapper = () => {
  const methods = useForm({
    defaultValues: {
      censusType: 'web3',
      addresses: [{ address: '', weight: 1 }],
    },
  })
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        <CensusWeb3Addresses />
        <button type='submit'>Submit</button>
      </form>
    </FormProvider>
  )
}

const LONG_ADDRESS = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

describe('CensusWeb3Addresses', () => {
  it('does not crash when a long address is typed', async () => {
    const user = userEvent.setup()

    render(<Wrapper />)

    const input = screen.getByPlaceholderText('0x000...000')
    await user.type(input, LONG_ADDRESS)

    expect(input).toBeInTheDocument()
  })

  it('shows a max-length validation error when address exceeds 42 characters', async () => {
    const user = userEvent.setup()

    render(<Wrapper />)

    const input = screen.getByPlaceholderText('0x000...000')
    await user.type(input, LONG_ADDRESS)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be at most 42 characters/i)).toBeInTheDocument()
    })
  })
})
