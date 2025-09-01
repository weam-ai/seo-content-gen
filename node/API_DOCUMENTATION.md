# NestJS API Documentation

**Base URL:** `http://localhost:8001`

**Authentication:** Temporarily disabled for testing purposes

## Available API Endpoints

### 1. Authentication (`/auth`)

#### POST `/auth/login`
- **Description:** User login
- **Payload:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### POST `/auth/forgot-password`
- **Description:** Request password reset
- **Payload:**
```json
{
  "email": "string"
}
```

#### POST `/auth/reset-password`
- **Description:** Reset password with token
- **Payload:**
```json
{
  "token": "string",
  "password": "string"
}
```

#### GET `/auth/profile`
- **Description:** Get user profile
- **Authentication:** Previously required JWT (now disabled)



#### POST `/auth/logout`
- **Description:** User logout

#### POST `/auth/auto-login`
- **Description:** Auto login with token

#### PATCH `/auth/update-password`
- **Description:** Update user password
- **Payload:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### 2. Users (`/users`)

#### GET `/users`
- **Description:** Get all users with pagination
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `search`: string
  - `sort`: string

#### POST `/users`
- **Description:** Create new user
- **Payload:**
```json
{
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "password": "string",
  "roleId": "string",
  "phone": "string" (optional),
  "gender": "string" (optional),
  "dob": "string" (optional),

}
```

#### GET `/users/:id`
- **Description:** Get user by ID

#### PATCH `/users/:id`
- **Description:** Update user
- **Payload:** Same as create user (partial)

#### DELETE `/users/:id`
- **Description:** Delete user



#### GET `/users/staff-members`
- **Description:** Get staff members

#### GET `/users/account-managers`
- **Description:** Get account managers

#### POST `/users/:id/profile-image`
- **Description:** Update user profile image
- **Payload:** Multipart form data with image file

### 3. Articles (`/article`)

#### GET `/article`
- **Description:** Get all articles with filtering
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `status`: string (comma-separated)
  - `search_by_status`: string
  - `search_by_project`: string
  - `staffid`: string
  // assigned_to_me field removed for single-user application

#### POST `/article`
- **Description:** Create new article
- **Payload:**
```json
{
  "title": "string",
  "content": "string",
  "projectId": "string",
  "status": "string"
  // assignedTo field removed for single-user application
}
```

#### GET `/article/:id`
- **Description:** Get article by ID

#### PATCH `/article/:id`
- **Description:** Update article

#### DELETE `/article/:id`
- **Description:** Delete article

### 4. Projects (`/projects`)

#### GET `/projects`
- **Description:** Get all projects

#### POST `/projects`
- **Description:** Create new project
- **Payload:**
```json
{
  "name": "string",
  "description": "string",
  "clientId": "string",
  "status": "string"
}
```

#### GET `/projects/:id`
- **Description:** Get project by ID

#### PATCH `/projects/:id`
- **Description:** Update project

#### DELETE `/projects/:id`
- **Description:** Delete project

### 5. Roles (`/roles`)

#### GET `/roles`
- **Description:** Get all roles with pagination

#### POST `/roles`
- **Description:** Create new role
- **Payload:**
```json
{
  "name": "string",
  "description": "string",
  "permissions": ["string"]
}
```

#### GET `/roles/permissions`
- **Description:** Get all available permissions

#### GET `/roles/list`
- **Description:** Get roles list (simplified)

#### GET `/roles/:id`
- **Description:** Get role by ID

#### PATCH `/roles/:id`
- **Description:** Update role

#### DELETE `/roles/:id`
- **Description:** Delete role

#### POST `/roles/user-permissions`
- **Description:** Create user permissions
- **Payload:**
```json
{
  "userId": "string",
  "permissions": ["string"]
}
```

### 6. Guidelines (`/guidelines`)

#### GET `/guidelines`
- **Description:** Get all guidelines with pagination

#### POST `/guidelines`
- **Description:** Create new guideline
- **Payload:**
```json
{
  "title": "string",
  "content": "string",
  "category": "string"
}
```

#### GET `/guidelines/list`
- **Description:** Get guidelines list (simplified)

#### GET `/guidelines/:id`
- **Description:** Get guideline by ID

#### PATCH `/guidelines/:id`
- **Description:** Update guideline

#### DELETE `/guidelines/:id`
- **Description:** Delete guideline

### 7. Dashboard (`/dashboard`)

#### GET `/dashboard/stats`
- **Description:** Get dashboard statistics

#### GET `/dashboard/recent-activities`
- **Description:** Get recent activities

### 8. Time Tracking (`/time-tracking`)

#### POST `/time-tracking/start`
- **Description:** Start time tracking
- **Payload:**
```json
{
  "projectId": "string",
  "taskDescription": "string"
}
```

#### POST `/time-tracking/stop`
- **Description:** Stop time tracking

#### GET `/time-tracking/logs`
- **Description:** Get time tracking logs

#### GET `/time-tracking/stats`
- **Description:** Get time tracking statistics

### 9. Gemini AI (`/gemini`)

#### POST `/gemini/audit-article`
- **Description:** Audit article using Gemini AI
- **Payload:**
```json
{
  "articleId": "string",
  "content": "string"
}
```

### 13. OpenAI (`/openai`)

#### POST `/openai/generate`
- **Description:** Generate content using OpenAI
- **Payload:**
```json
{
  "prompt": "string",
  "model": "string",
  "maxTokens": number
}
```

### 14. Reports (`/reports`)

#### GET `/reports/send`
- **Description:** Send weekly report

### 15. Global (`/global`)

#### GET `/global/config`
- **Description:** Get global configuration

### 16. Health Check (`/`)

#### GET `/`
- **Description:** Basic hello endpoint

#### GET `/health`
- **Description:** Health check endpoint
- **Response:**
```json
{
  "status": "ok",
  "message": "Health check successful",
  "timestamp": "ISO string",
  "uptime": number,
  "version": "string"
}
```

#### POST `/run-migrations`
- **Description:** Run database migrations (protected by static token)

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "status": true,
  "message": "Success message",
  "data": {} // Optional data object
}
```

### Paginated Response
```json
{
  "status": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error message"
}
```

## Testing the APIs

1. **Application is running on:** `http://localhost:8001`
2. **Authentication is temporarily disabled** for easier testing
3. **Use tools like Postman, curl, or any HTTP client** to test the endpoints
4. **Default admin credentials** (if needed): `admin@gmail.com` / `admin@123`

## Example API Calls

### Create a User
```bash
curl -X POST http://localhost:8001/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "roleId": "role_id_here"
  }'
```

### Get All Articles
```bash
curl -X GET "http://localhost:8001/article?page=1&limit=10"
```

### Login
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin@123"
  }'
```

---

**Note:** This documentation covers the main API endpoints. Some endpoints may have additional query parameters or payload fields. Authentication guards have been temporarily removed for testing purposes.