# Authentication

Authentication uses **JWT (JSON Web Token)** with FastAPI.

Libraries

- PyJWT
- passlib[bcrypt]
- python-jose
- FastAPI Security

Cost: ₹0

---

## User Roles

- Admin
- Investigation Officer
- Crime Analyst

---

## POST /auth/login

Authenticate a user and issue a JWT access token.

### Request

```json
{
  "username": "officer1",
  "password": "password123"
}
```

### Success Response (200)

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "Demo Officer",
    "role": "Investigation Officer"
  }
}
```

### Error Response (401)

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

## POST /auth/logout

Invalidate the current session on the client.

### Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## GET /auth/me

Returns details of the authenticated user.

### Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Response

```json
{
  "id": 1,
  "name": "Demo Officer",
  "email": "officer@example.com",
  "role": "Investigation Officer"
}
```

---

## Authentication Flow

Login

↓

Validate Credentials

↓

Generate JWT

↓

Return Token

↓

Store Token (Frontend)

↓

Attach Token to Every API Request

↓

Validate Token on Backend

↓

Return Requested Resource

---

## Protected Routes

Requires JWT Authentication

- GET /dashboard
- GET /heatmap
- GET /criminals
- GET /network/{criminal_id}
- GET /alerts
- GET /reports
- POST /chat
- POST /predict/*
- POST /reports/generate

---

## HTTP Headers

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Security

- Passwords hashed using bcrypt
- JWT signed using HS256
- Token expiration: 1 hour
- Backend validates JWT for protected endpoints
- Secrets stored in `.env`
- CORS enabled only for frontend origin

---

## Free Libraries

| Library | Purpose |
|----------|---------|
| FastAPI | Backend |
| python-jose | JWT |
| passlib[bcrypt] | Password Hashing |
| python-multipart | Form Handling |
| SQLAlchemy | ORM |
| PostgreSQL | Database |

Total Authentication Cost: **₹0**
