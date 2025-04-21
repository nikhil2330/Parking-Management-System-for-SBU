// client/src/__tests__/SignInPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '../pages/SignInPage';
import { BrowserRouter} from 'react-router-dom';


// Mock AuthService.loginUser to simulate API responses
jest.mock('../services/AuthService', () => ({
  loginUser: jest.fn(({ email, password }) => {
    if (email === 'testuser@example.com' && password === 'Pass123!') {
      return Promise.resolve({ success: true, token: 'fake-token', username: 'TestUser' });
    } else {
      return Promise.reject(new Error('Invalid credentials'));
    }
  }),
}));

describe('SignInPage', () => {
  it('renders the sign in form', () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('shows an error when required fields are empty', async () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByText(/Sign In/i));
    expect(await screen.findByText(/Please enter your email/i)).toBeInTheDocument();
  });

  it('logs in successfully with correct credentials', async () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'testuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Pass123!' },
    });
    fireEvent.click(screen.getByText(/Sign In/i));
    await waitFor(() => {
      expect(screen.getByText(/Signing you in/i)).toBeInTheDocument();
    });
  });
});
