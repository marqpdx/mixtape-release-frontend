# Data Models & API Contracts

## Overview
This document describes the data structures exchanged between frontend and backend, including expected JSON formats from Django serializers.

---

## Authentication Models

### User
**Endpoint**: `[TBD]`
**Method**: GET

**Response Schema**:
```json
{
  "id": number,
  "email": string,
  "firstName": string,
  "lastName": string,
  "roles": string[],
  "createdAt": string (ISO 8601),
  "updatedAt": string (ISO 8601)
}
```

**Example**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["user", "admin"],
  "createdAt": "2025-11-10T12:00:00Z",
  "updatedAt": "2025-11-10T12:00:00Z"
}
```

---

### Login Request
**Endpoint**: `[TBD]`
**Method**: POST

**Request Schema**:
```json
{
  "email": string,
  "password": string
}
```

**Response Schema**:
```json
{
  "access": string,
  "refresh": string,
  "user": User
}
```

**Example**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  }
}
```

---

## [Additional Models - TBD]

### [Model Name]
**Endpoint**: `[TBD]`
**Method**: [GET/POST/PUT/DELETE]

**Schema**:
```json
{
  // To be defined
}
```

---

## Common Patterns

### Error Response
All API errors follow this format:
```json
{
  "error": {
    "message": string,
    "code": string,
    "details": object (optional)
  }
}
```

**Example**:
```json
{
  "error": {
    "message": "Invalid credentials",
    "code": "AUTH_INVALID_CREDENTIALS",
    "details": {
      "field": "password"
    }
  }
}
```

### Pagination
Paginated responses follow this format:
```json
{
  "count": number,
  "next": string | null,
  "previous": string | null,
  "results": Array<T>
}
```

---

## TypeScript Types
When Zod is integrated, schemas will be defined as:
```typescript
// Example (not yet implemented)
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>;
```

---

*Last updated: 2025-11-10*
*Status: Initial draft - will be populated as API contracts are established*
