import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { renderWithProviders } from '../test/utils'

describe('LoginPage form validation', () => {
  it('shows field errors and does not submit when the form is empty', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' })
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('complains about a badly formatted email', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' })
    await userEvent.type(screen.getByLabelText('Email'), 'meria@')
    await userEvent.type(screen.getByLabelText('Password'), 'secret12')
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByText('That email doesn\'t look right')).toBeInTheDocument()
  })
})
