# BitTrade Authentication System

## Overview
This document describes the JWT-based authentication system implemented for the BitTrade cryptocurrency trading platform.

## Backend Implementation

### Dependencies Added
- `jsonwebtoken` - JWT token generation and verification
- `bcrypt` - Password hashing

### Authentication Routes (`/server/routes/auth.js`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Authentication Middleware (`/server/middleware/auth.js`)
- `authenticateToken` - Required authentication middleware
- `optionalAuth` - Optional authentication middleware

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 12
- Minimum password length: 6 characters
- Password confirmation validation on registration

### JWT Token Configuration
- Secret key: `bittrade_secret_key_2024` (configurable via environment variable)
- Token expiration: 24 hours
- Token payload includes: user ID, email, and name

### Validation Features
- Email format validation
- Password confirmation matching
- Duplicate email checking
- Input sanitization

## Frontend Implementation

### Authentication Context (`/client/src/context/AuthContext.tsx`)
- Centralized authentication state management
- Automatic token verification on app load
- Persistent authentication via localStorage
- Automatic logout on token expiration

### Authentication Pages
- **Login Page** (`/client/src/pages/Login.tsx`)
  - Email and password authentication
  - Show/hide password toggle
  - Error handling and loading states
  - Link to registration page

- **Register Page** (`/client/src/pages/Register.tsx`)
  - Full name, email, password, and password confirmation fields
  - Password strength validation
  - Show/hide password toggle
  - Error handling and loading states
  - Link to login page

### Protected Route Component (`/client/src/components/ProtectedRoute.tsx`)
- Automatic redirection to login for unauthenticated users
- Loading state while checking authentication
- Easy wrapper for protected components

### Design Features
- Modern black and grey color scheme
- Orange brand color accents (`bg-orange-600`, `text-orange-500`)
- Responsive design with mobile-first approach
- Lucide React icons for better UX
- Smooth transitions and hover effects

## API Endpoints

### Registration
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "confirmPassword": "securepassword"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Token Verification
```
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Error Handling

### Common Error Responses
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials or token
- `403 Forbidden` - Token expired or malformed
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

### Example Error Response
```json
{
  "error": "Invalid email or password"
}
```

## Security Features

### Backend Security
- Password hashing with bcrypt
- JWT token expiration
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration for cross-origin requests

### Frontend Security
- Secure token storage in localStorage
- Automatic token cleanup on logout
- Protected route implementation
- Input validation on forms
- XSS prevention with proper escaping

## Usage Example

### Protecting a Route
```tsx
import ProtectedRoute from '../components/ProtectedRoute';

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Using Authentication Context
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      Welcome, {user.name}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Testing the Authentication System

1. **Start the server:**
   ```bash
   cd server && npm run dev
   ```

2. **Start the client:**
   ```bash
   cd client && npm start
   ```

3. **Access the authentication pages:**
   - Registration: `http://localhost:3000/register`
   - Login: `http://localhost:3000/login`

4. **Test the API endpoints:**
   ```bash
   # Register a new user
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","name":"Test User","password":"password123","confirmPassword":"password123"}'
   
   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Future Enhancements

- Password reset functionality
- Email verification
- Multi-factor authentication
- Session management
- Rate limiting for authentication endpoints
- OAuth integration (Google, GitHub)
- Role-based access control
- Audit logging for authentication events
