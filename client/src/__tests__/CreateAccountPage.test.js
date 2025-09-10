// client/src/__tests__/CreateAccountPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAccountPage from '../pages/CreateAccountPage'
import { BrowserRouter} from 'react-router-dom';


// Mock AuthService.registerUser to simulate a successful registration
jest.mock('../services/AuthService', () => ({
  registerUser: jest.fn(() => Promise.resolve({ message: 'User registered successfully' })),
}));

describe('CreateAccountPage', () => {
  it('displays validation errors when required fields are missing', async () => {
    render(
      <BrowserRouter>
        <CreateAccountPage />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByText(/Create Account/i));
    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
  });
});
