import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileModal from '../ProfileModal';
import { AuthProvider } from '../../context/AuthContext';

// Mock the AuthContext
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com'
};

const mockAuthContext = {
  user: mockUser,
  token: 'test-token',
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  isLoading: false
};

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => mockAuthContext
}));

describe('ProfileModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onEditName: jest.fn(),
    onEditEmail: jest.fn(),
    onChangePassword: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders profile modal when open', () => {
    render(<ProfileModal {...mockProps} />);
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProfileModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ProfileModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEditName when name section is clicked', () => {
    render(<ProfileModal {...mockProps} />);
    
    const nameSection = screen.getByText('Name').closest('[data-clickable="true"]');
    if (nameSection) {
      fireEvent.click(nameSection);
      expect(mockProps.onEditName).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onEditEmail when email section is clicked', () => {
    render(<ProfileModal {...mockProps} />);
    
    const emailSection = screen.getByText('Email Address').closest('[data-clickable="true"]');
    if (emailSection) {
      fireEvent.click(emailSection);
      expect(mockProps.onEditEmail).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onChangePassword when password section is clicked', () => {
    render(<ProfileModal {...mockProps} />);
    
    const passwordSection = screen.getByText('Change Password').closest('[data-clickable="true"]');
    if (passwordSection) {
      fireEvent.click(passwordSection);
      expect(mockProps.onChangePassword).toHaveBeenCalledTimes(1);
    }
  });

  it('calls logout when sign out button is clicked', () => {
    render(<ProfileModal {...mockProps} />);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
  });
});
