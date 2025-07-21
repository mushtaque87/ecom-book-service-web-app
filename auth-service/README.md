# Authentication Service

A secure JWT-based authentication service built with Node.js, Express, and MySQL. This service provides user registration, login, token management, and user profile management with comprehensive security features.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🔒 **Password Hashing** - Bcrypt password hashing with salt rounds
- 🛡️ **Security Features** - Rate limiting, CORS, Helmet security headers
- 🔄 **Token Refresh** - Automatic token refresh mechanism
- 👥 **Role-based Access** - User, admin, and publisher roles
- 🚫 **Brute Force Protection** - Failed login attempt tracking
- 📊 **User Management** - Complete user CRUD operations
- ✅ **Input Validation** - Joi schema validation
- 🏥 **Health Checks** - Service health monitoring

## Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn

## Installation

1. **Clone the repository and navigate to the auth-service directory:**

   ```bash
   cd auth-service
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the auth-service directory with the following variables:

   ```env
   # Server Configuration
   PORT=5001

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=auth_service
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h

   # Security Configuration
   NODE_ENV=development
   ```

4. **Set up MySQL database:**

   ```sql
   CREATE DATABASE auth_service;
   ```

5. **Start the service:**
   ```bash
   npm start
   ```

The service will automatically create the required tables on startup.

## Docker Setup

1. **Build the Docker image:**

   ```bash
   docker build -t auth-service .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up auth-service
   ```

## API Endpoints

### Authentication Endpoints

#### POST /register

Register a new user account.

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /login

Authenticate user and receive JWT tokens.

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /logout

Logout user and invalidate refresh tokens.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

### User Management Endpoints

#### GET /profile

Get current user's profile information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PUT /profile/:userId

Update user profile (admin or own profile only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully"
}
```

#### GET /users

Get all users (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### PATCH /users/:userId/status

Activate/deactivate user (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "isActive": false
}
```

**Response:**

```json
{
  "message": "User deactivated successfully"
}
```

### Utility Endpoints

#### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "Auth Service healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

#### POST /verify

Verify JWT token validity.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "userId": 1,
    "username": "johndoe",
    "role": "user"
  }
}
```

## Security Features

### Rate Limiting

- 100 requests per 15 minutes per IP address
- Applied to all endpoints

### Password Security

- Bcrypt hashing with 12 salt rounds
- Minimum 6 character password requirement

### JWT Security

- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Refresh tokens stored in database for revocation

### Brute Force Protection

- Tracks failed login attempts by username and IP
- Blocks login after 5 failed attempts in 15 minutes
- Automatic cleanup of old failed attempts

### Input Validation

- Joi schema validation for all inputs
- SQL injection prevention with parameterized queries
- XSS protection with Helmet middleware

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  role ENUM('user', 'admin', 'publisher') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Failed Login Attempts Table

```sql
CREATE TABLE failed_login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

The service returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Testing

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
