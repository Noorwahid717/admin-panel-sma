# Fix for 401 Unauthorized Error on Login

## Problem

When attempting to login with valid credentials (`superadmin@example.sch.id` / `Admin123!`), the login would fail with a 401 error:

```
GET https://admin-panel-sma-production.up.railway.app/api/v1/auth/me 401 (Unauthorized)
```

## Root Cause

The admin frontend's `authProvider.ts` was expecting a different response format from the API than what the API actually returns:

### API Returns (Correct Format)

```typescript
{
  accessToken: string,      // camelCase
  refreshToken: string,     // camelCase
  expiresIn: number,
  refreshExpiresIn: number,
  tokenType: "Bearer"
}
```

### Admin Expected (Incorrect Format)

```typescript
{
  access_token: string,     // snake_case - WRONG
  refresh_token: string,    // snake_case - WRONG
  user: {                   // Missing in API response
    id, email, fullName, role
  }
}
```

### What Was Happening

1. User submits login credentials
2. API validates credentials and returns tokens in **camelCase** format (`accessToken`, `refreshToken`)
3. Admin tries to store tokens using **snake_case** keys (`data.access_token`, `data.refresh_token`)
4. Since these properties don't exist, `undefined` values are stored in localStorage
5. On the next request to `/auth/me`, the Authorization header contains `Bearer undefined`
6. API rejects the request with 401 Unauthorized
7. User cannot access the admin panel

## Solution

Updated `apps/admin/src/providers/authProvider.ts` to:

1. **Use correct token property names**: Changed from `access_token`/`refresh_token` to `accessToken`/`refreshToken` to match API response
2. **Fetch user data separately**: After successful login, make a separate request to `/auth/me` to get user information
3. **Update TypeScript interfaces**: Corrected `AuthResponse` interface and added `UserResponse` interface

### Changes Made

```typescript
// BEFORE (WRONG)
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: { ... };
}

const data: AuthResponse = await response.json();
setTokens(data.access_token, data.refresh_token);
localStorage.setItem("user", JSON.stringify(data.user));

// AFTER (CORRECT)
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
}

interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  teacherId?: string | null;
  studentId?: string | null;
}

const data: AuthResponse = await response.json();
setTokens(data.accessToken, data.refreshToken);

// Fetch user info separately
const userResponse = await fetch(`${API_URL}/auth/me`, {
  headers: {
    Authorization: `Bearer ${data.accessToken}`,
  },
});
if (userResponse.ok) {
  const user: UserResponse = await userResponse.json();
  localStorage.setItem("user", JSON.stringify(user));
}
```

## Testing

To verify the fix works:

1. Open browser DevTools (F12) → Application → Local Storage
2. Clear all storage for the admin site
3. Navigate to login page
4. Enter credentials: `superadmin@example.sch.id` / `Admin123!`
5. After successful login, check Local Storage:
   - `access_token` should contain a JWT token
   - `refresh_token` should contain a JWT token
   - `user` should contain user object with id, email, fullName, role
6. Navigate through the admin panel - should work without 401 errors

## API Contract

The fix ensures the admin frontend correctly handles the API's authentication contract:

### POST /api/v1/auth/login

**Request:**

```json
{
  "email": "superadmin@example.sch.id",
  "password": "Admin123!"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "refreshExpiresIn": 2592000,
  "tokenType": "Bearer"
}
```

### GET /api/v1/auth/me

**Request Headers:**

```
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "id": "user_superadmin",
  "email": "superadmin@example.sch.id",
  "fullName": "Super Admin",
  "role": "SUPERADMIN",
  "teacherId": null,
  "studentId": null
}
```

## Related Files

- `apps/admin/src/providers/authProvider.ts` - Fixed admin authentication provider
- `apps/api/src/modules/auth/auth.service.ts` - API authentication service (unchanged)
- `apps/api/src/modules/auth/auth.controller.ts` - API authentication endpoints (unchanged)
- `apps/api/src/modules/auth/auth.types.ts` - API type definitions (unchanged)

## Deployment Notes

For production deployments (Vercel + Railway):

1. Ensure `VITE_API_URL` in Vercel points to the correct Railway API URL
2. Ensure `CORS_ALLOWED_ORIGINS` in Railway includes the Vercel domain
3. Redeploy admin after this fix is merged
4. No API changes required - API was already correct

## Prevention

To prevent similar issues in the future:

1. Keep API response types synchronized between backend and frontend
2. Consider generating TypeScript types from OpenAPI/Swagger spec
3. Add integration tests that verify authentication flow end-to-end
4. Document API contracts clearly in the codebase
