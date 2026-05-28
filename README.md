# Multi-Tenant Task Management API

This project is a Flask REST API for managing daily tasks in a multi-tenant system.

In simple words: one enterprise can have many organizations, every organization has its own users, and users can submit daily tasks. The application keeps each organization's users and tasks in a separate SQL Server schema so that tenant data is separated inside the same database.

This README is intentionally detailed and beginner-friendly. If you are new to Flask, APIs, JWT, SQL Server, or multi-tenant projects, read it from top to bottom once.

## Table Of Contents

1. [What This Project Does](#what-this-project-does)
2. [Important Concepts](#important-concepts)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [How The Application Starts](#how-the-application-starts)
6. [Database Design](#database-design)
7. [Authentication And Roles](#authentication-and-roles)
8. [Prerequisites](#prerequisites)
9. [Setup On Windows](#setup-on-windows)
10. [Database Setup](#database-setup)
11. [Seed The First Enterprise Admin](#seed-the-first-enterprise-admin)
12. [Run The API](#run-the-api)
13. [Test The API Manually](#test-the-api-manually)
14. [API Reference](#api-reference)
15. [Environment Variables](#environment-variables)
16. [Sample JSON Files](#sample-json-files)
17. [Common Errors And Fixes](#common-errors-and-fixes)
18. [Development Notes](#development-notes)
19. [Beginner Glossary](#beginner-glossary)
20. [Quick Beginner Checklist](#quick-beginner-checklist)

## What This Project Does

This API supports this workflow:

1. An enterprise admin logs in.
2. The enterprise admin creates organizations.
3. When an organization is created, the app automatically creates a SQL Server schema for that organization.
4. Inside that organization's schema, the app creates:
   - a `users` table
   - a `daily_tasks` table
5. Enterprise admins or organization admins can create users inside an organization.
6. Organization users can log in.
7. Logged-in organization users can create and update their own daily tasks.
8. Enterprise admins and organization admins can view task reports.

The API does not have a frontend UI. You test it using tools like:

- `curl.exe`
- Postman
- Thunder Client in VS Code
- Insomnia

## Important Concepts

### What Is An API?

An API is a backend service that receives HTTP requests and sends JSON responses.

For example, this request:

```http
GET /health
```

returns this JSON:

```json
{
  "message": "Task Management API is running"
}
```

### What Is Multi-Tenancy?

Multi-tenancy means one application serves multiple customers or groups.

In this project:

- The enterprise is the top-level owner.
- An enterprise can have many organizations.
- Each organization is a tenant.
- Each tenant gets its own SQL Server schema.

Example:

```text
TaskManagementDB
|
+-- dbo.enterprises
+-- dbo.organizations
+-- org_alpha.users
+-- org_alpha.daily_tasks
+-- org_beta.users
+-- org_beta.daily_tasks
```

This means `Org Alpha` users and tasks are stored separately from `Org Beta` users and tasks.

### What Is A SQL Server Schema?

A schema is like a folder inside a database.

The default SQL Server schema is usually `dbo`.

This app uses:

- `dbo` for enterprise-level tables
- one custom schema per organization

For example, if you create an organization named `Org Beta`, the app converts that name into the schema name `org_beta`.

## Project Structure

```text
multitenant/
|
+-- app/
|   |
|   +-- __init__.py
|   +-- config.py
|   +-- db.py
|   |
|   +-- models/
|   |   |
|   |   +-- __init__.py
|   |   +-- enterprise.py
|   |   +-- tenant.py
|   |
|   +-- routes/
|   |   |
|   |   +-- __init__.py
|   |   +-- auth.py
|   |   +-- enterprise.py
|   |   +-- users.py
|   |   +-- tasks.py
|   |
|   +-- utils/
|       |
|       +-- __init__.py
|       +-- auth_helpers.py
|       +-- schema.py
|
+-- run.py
+-- requirements.txt
+-- login.json
+-- org.json
+-- org_beta.json
+-- org_login.json
+-- org_update.json
+-- user_beta.json
+-- user_beta_2.json
+-- user_beta_update.json
+-- task_create.json
+-- task_update.json
+-- README.md
```

### Main Files Explained

| File | Purpose |
| --- | --- |
| `run.py` | Starts the Flask server. |
| `requirements.txt` | Lists Python packages required by the project. |
| `app/__init__.py` | Creates the Flask app, initializes JWT, initializes the database, and registers routes. |
| `app/config.py` | Reads environment variables and builds the SQL Server connection string. |
| `app/db.py` | Creates the SQLAlchemy engine and database session. Also creates main tables. |
| `app/models/enterprise.py` | Defines `Enterprise` and `Organization` tables in the main schema. |
| `app/models/tenant.py` | Defines dynamic tenant tables: `users` and `daily_tasks`. |
| `app/routes/auth.py` | Login endpoints for enterprise admins and organization users. |
| `app/routes/enterprise.py` | Organization management endpoints. |
| `app/routes/users.py` | User management endpoints inside organizations. |
| `app/routes/tasks.py` | Task creation, task update, and task reporting endpoints. |
| `app/utils/auth_helpers.py` | Helper functions for JWT identity, role checks, and organization access checks. |
| `app/utils/schema.py` | Helper functions for converting organization names into schema names and creating schemas. |

## Tech Stack

This project uses:

| Tool | Why It Is Used |
| --- | --- |
| Python | Main programming language. |
| Flask | Web framework for building the API. |
| Flask-JWT-Extended | Creates and validates JWT login tokens. |
| SQLAlchemy | Python database toolkit used to talk to SQL Server. |
| pyodbc | SQL Server driver connection layer. |
| Werkzeug | Password hashing and password checking. |
| SQL Server | Database used by the app. |

## How The Application Starts

The start point is `run.py`.

```python
from app import create_app

app = create_app()
```

When `create_app()` runs, it:

1. Creates the Flask application.
2. Loads configuration from `app/config.py`.
3. Initializes JWT support.
4. Initializes the SQL Server database connection.
5. Creates the main database tables if they do not exist.
6. Registers API routes.
7. Adds the `/` and `/health` health-check endpoints.

The health-check endpoint returns:

```json
{
  "message": "Task Management API is running"
}
```

## Database Design

### Main Tables

These tables are created in the default schema, usually `dbo`.

#### `enterprises`

Stores enterprise admin accounts.

| Column | Meaning |
| --- | --- |
| `id` | Primary key. Auto-generated. |
| `name` | Enterprise admin or enterprise name. |
| `email` | Login email for the enterprise admin. Must be unique. |
| `password_hash` | Hashed password. The real password is not stored. |
| `created_at` | Date and time when the enterprise was created. |

Important: there is currently no API endpoint to register an enterprise admin. You must seed the first enterprise admin manually in the database.

#### `organizations`

Stores organizations owned by an enterprise.

| Column | Meaning |
| --- | --- |
| `id` | Primary key. Auto-generated. |
| `enterprise_id` | Links the organization to an enterprise. |
| `name` | Organization display name. |
| `schema_name` | SQL Server schema name for this organization. |
| `created_at` | Date and time when the organization was created. |
| `is_active` | If false, the organization is treated as deactivated. |

### Tenant Tables

Every organization gets its own schema.

For example:

```text
org_alpha.users
org_alpha.daily_tasks
org_beta.users
org_beta.daily_tasks
```

#### `<tenant_schema>.users`

Stores users for one organization.

| Column | Meaning |
| --- | --- |
| `id` | Primary key. Auto-generated inside that organization's schema. |
| `org_id` | Organization id from `dbo.organizations`. |
| `full_name` | User's full name. |
| `email` | User's login email. Unique inside that organization's schema. |
| `password_hash` | Hashed password. |
| `role` | Either `user` or `org_admin`. |
| `is_active` | If false, the user cannot log in. |
| `created_at` | Date and time when the user was created. |

#### `<tenant_schema>.daily_tasks`

Stores daily tasks for users in one organization.

| Column | Meaning |
| --- | --- |
| `id` | Primary key. |
| `user_id` | The user who owns the task. |
| `task_date` | Date for the task. Defaults to today's date in SQL Server. |
| `title` | Task title. Required. |
| `description` | Optional task details. |
| `status` | `pending`, `in_progress`, or `completed`. |
| `hours_spent` | Optional number of hours spent. |
| `created_at` | Date and time when the task was created. |

## Authentication And Roles

This project uses JWT tokens.

JWT means JSON Web Token. After login, the API returns a long token string. You must send that token in future requests.

The header format is:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Roles

| Role | What It Can Do |
| --- | --- |
| `enterprise_admin` | Manage organizations, manage users in organizations, view tasks across organizations. |
| `org_admin` | Manage users and view tasks only inside their own organization. |
| `user` | Create, list, and update their own tasks. |

### Login Types

There are two login endpoints:

| Login Type | Endpoint | Who Uses It |
| --- | --- | --- |
| Enterprise login | `POST /api/auth/enterprise/login` | Enterprise admins. |
| Organization login | `POST /api/auth/org/login` | Organization admins and normal users. |

### What Is Stored In The Token?

The token includes useful identity data.

Enterprise admin tokens include:

- `role`
- `enterprise_id`
- `enterprise_name`
- `enterprise_email`

Organization user tokens include:

- `role`
- `enterprise_id`
- `org_id`
- `schema_name`
- `user_id`
- `user_name`
- `user_email`

The app uses these token values to decide what data the logged-in person can access.

## Prerequisites

Install these before running the project:

1. Python 3.11 or newer
2. SQL Server
3. Microsoft ODBC Driver for SQL Server
4. Git is optional for this local project
5. Postman, Thunder Client, or `curl.exe` for testing

You can check Python with:

```powershell
python --version
```

or:

```powershell
py --version
```

## Setup On Windows

Open PowerShell in the project folder:

```powershell
cd C:\Users\kannikasre\OneDrive\Desktop\multitenant
```

Create a virtual environment:

```powershell
py -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate again:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

## Database Setup

This project expects a SQL Server database named:

```text
TaskManagementDB
```

The application creates tables inside the database, but it does not create the database itself.

So first, create the database manually using SQL Server Management Studio, Azure Data Studio, or `sqlcmd`.

SQL:

```sql
CREATE DATABASE TaskManagementDB;
```

### Option 1: Docker SQL Server

The default code assumes Docker SQL Server with these settings:

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Database | `TaskManagementDB` |
| User | `sa` |
| Password | `YourStrongPass@123` |
| Driver | `ODBC Driver 18 for SQL Server` |

This default is used because `USE_DOCKER_SQL_SERVER` defaults to `true` in `app/config.py`.

The default connection string is equivalent to:

```text
mssql+pyodbc://sa:YourStrongPass%40123@127.0.0.1/TaskManagementDB?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

If you use Docker, make sure your SQL Server container password matches `YourStrongPass@123`, or set a custom `DATABASE_URL`.

### Option 2: Local SQL Server With Windows Authentication

If you are using your local SQL Server instead of Docker, set this before running the app:

```powershell
$env:USE_DOCKER_SQL_SERVER = "false"
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "1433"
$env:DB_NAME = "TaskManagementDB"
$env:DB_DRIVER = "ODBC Driver 18 for SQL Server"
$env:DB_ENCRYPT = "no"
$env:DB_TRUST_SERVER_CERTIFICATE = "yes"
```

Because `DB_USER` and `DB_PASSWORD` are not set, the app uses Windows trusted authentication.

### Option 3: Local SQL Server With Username And Password

If you want SQL username and password authentication:

```powershell
$env:USE_DOCKER_SQL_SERVER = "false"
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "1433"
$env:DB_NAME = "TaskManagementDB"
$env:DB_USER = "sa"
$env:DB_PASSWORD = "YourStrongPass@123"
$env:DB_DRIVER = "ODBC Driver 18 for SQL Server"
$env:DB_ENCRYPT = "no"
$env:DB_TRUST_SERVER_CERTIFICATE = "yes"
```

### Important Environment Note

Set environment variables in the same PowerShell window before running:

```powershell
python run.py
```

The current project reads database settings while the app is being created. Setting variables after the server has already started will not change the running app.

## Seed The First Enterprise Admin

The app has login for enterprise admins, but it does not currently have a route like `POST /api/enterprise/register`.

That means you must create the first enterprise admin manually.

Before inserting the first enterprise admin, make sure the main tables exist. The easiest way is to create `TaskManagementDB`, set your database environment variables, and run the app once:

```powershell
python run.py
```

When the app starts successfully, `app/db.py` creates `dbo.enterprises` and `dbo.organizations` if they do not already exist. You can leave the server running while you insert the enterprise admin from SQL Server Management Studio or Azure Data Studio. If you stop it, start it again after seeding.

### Step 1: Generate A Password Hash

Run this in PowerShell while your virtual environment is active:

```powershell
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin@123'))"
```

It will print a long password hash.

Example shape:

```text
scrypt:32768:8:1$some_random_text$some_long_hash
```

Your actual hash will be different. That is normal.

## Organization Security Code Update

Organization logins now require a permanent 6-digit security code. The login body is:

```json
{
  "email": "admin@org.com",
  "password": "password123",
  "org_code": "482913"
}
```

Enterprise organization creation now expects `org_admin_email` so the security code can be emailed immediately after the organization is created.

The app also includes a regeneration endpoint for enterprise admins:

```http
POST /api/enterprise/organizations/<org_id>/org-code/regenerate
```

Use the `.env.example` file as the base for Gmail SMTP configuration. The required mail variables are `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_DEFAULT_SENDER`.

## Angular Frontend

The project now includes an Angular frontend scaffold in `frontend/` for end-to-end auth testing.

It supports:

- enterprise admin login
- organization admin login with org code
- normal user login with org code
- enterprise organization creation
- organization code regeneration
- org admin user creation
- user task submission

Frontend API calls go to the Flask backend through the Angular dev-server proxy. If you run the frontend on a different host or port, update `CORS_ORIGINS` in `.env` and the proxy config in `frontend/proxy.conf.json`.

### Frontend Run Steps

```powershell
cd frontend
npm install
npm start
```

The app will open on `http://127.0.0.1:4200` and talk to the backend at `http://127.0.0.1:5000`.

### Step 2: Insert The Enterprise Admin

Open SQL Server Management Studio or Azure Data Studio and run:

```sql
USE TaskManagementDB;

INSERT INTO dbo.enterprises (name, email, password_hash)
VALUES (
    'Task Management Admin',
    'admin@taskmgmt.local',
    'PASTE_THE_HASH_HERE'
);
```

Replace `PASTE_THE_HASH_HERE` with the hash from Step 1.

### Step 3: Confirm It Exists

Run:

```sql
SELECT id, name, email, created_at
FROM dbo.enterprises;
```

You should see your enterprise admin row.

## Run The API

Start the server:

```powershell
python run.py
```

By default, it runs on:

```text
http://127.0.0.1:5000
```

Open this in your browser:

```text
http://127.0.0.1:5000/health
```

Expected response:

```json
{
  "message": "Task Management API is running"
}
```

### Optional Server Settings

You can change host, port, and debug mode:

```powershell
$env:FLASK_HOST = "127.0.0.1"
$env:FLASK_PORT = "5000"
$env:FLASK_DEBUG = "true"
python run.py
```

## Test The API Manually

These examples use PowerShell and `curl.exe`.

Important: on Windows PowerShell, use `curl.exe`, not just `curl`. In PowerShell, `curl` can be an alias for another command.

### 1. Health Check

```powershell
curl.exe http://127.0.0.1:5000/health
```

Expected:

```json
{
  "message": "Task Management API is running"
}
```

### 2. Enterprise Admin Login

The repo includes `login.json`:

```json
{
  "email": "admin@taskmgmt.local",
  "password": "Admin@123"
}
```

Login:

```powershell
$enterpriseLogin = curl.exe -s -X POST http://127.0.0.1:5000/api/auth/enterprise/login `
  -H "Content-Type: application/json" `
  --data "@login.json" | ConvertFrom-Json

$enterpriseToken = $enterpriseLogin.access_token
```

Check that you got a token:

```powershell
$enterpriseToken
```

If login is successful, the token will be a very long string.

### 3. Create An Organization

The repo includes `org_beta.json`:

```json
{
  "name": "Org Beta"
}
```

Create organization:

```powershell
$org = curl.exe -s -X POST http://127.0.0.1:5000/api/enterprise/organizations `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $enterpriseToken" `
  --data "@org_beta.json" | ConvertFrom-Json

$orgId = $org.id
$orgId
```

This creates:

- a row in `dbo.organizations`
- a schema named `org_beta`
- `org_beta.users`
- `org_beta.daily_tasks`

### 4. List Organizations

```powershell
curl.exe -X GET http://127.0.0.1:5000/api/enterprise/organizations `
  -H "Authorization: Bearer $enterpriseToken"
```

### 5. Create An Organization Admin User

The repo includes `user_beta.json`:

```json
{
  "full_name": "Beta Admin",
  "email": "beta.admin@taskmgmt.local",
  "password": "Admin@123",
  "role": "org_admin"
}
```

Create the user:

```powershell
curl.exe -X POST "http://127.0.0.1:5000/api/orgs/$orgId/users" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $enterpriseToken" `
  --data "@user_beta.json"
```

### 6. Create A Normal User

The repo includes `user_beta_2.json`:

```json
{
  "full_name": "Beta User",
  "email": "beta.user@taskmgmt.local",
  "password": "User@123",
  "role": "user"
}
```

Create the user:

```powershell
curl.exe -X POST "http://127.0.0.1:5000/api/orgs/$orgId/users" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $enterpriseToken" `
  --data "@user_beta_2.json"
```

### 7. Organization User Login

Use the organization id that was returned when you created the organization.

```powershell
$orgLoginBody = @{
  org_id = $orgId
  email = "beta.user@taskmgmt.local"
  password = "User@123"
} | ConvertTo-Json

$orgLogin = curl.exe -s -X POST http://127.0.0.1:5000/api/auth/org/login `
  -H "Content-Type: application/json" `
  --data $orgLoginBody | ConvertFrom-Json

$orgToken = $orgLogin.access_token
$orgToken
```

### 8. Create A Task

The repo includes `task_create.json`:

```json
{
  "title": "First Task",
  "description": "Initial tenant task",
  "hours_spent": 1.5
}
```

Create a task:

```powershell
$task = curl.exe -s -X POST http://127.0.0.1:5000/api/tasks `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $orgToken" `
  --data "@task_create.json" | ConvertFrom-Json

$taskId = $task.id
$taskId
```

### 9. List My Tasks

```powershell
curl.exe -X GET http://127.0.0.1:5000/api/tasks/my `
  -H "Authorization: Bearer $orgToken"
```

### 10. Update A Task

The repo includes `task_update.json`:

```json
{
  "title": "First Task Updated",
  "status": "completed",
  "hours_spent": 2.25
}
```

Update:

```powershell
curl.exe -X PUT "http://127.0.0.1:5000/api/tasks/$taskId" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $orgToken" `
  --data "@task_update.json"
```

### 11. Enterprise Admin View All Tasks

```powershell
curl.exe -X GET http://127.0.0.1:5000/api/enterprise/tasks `
  -H "Authorization: Bearer $enterpriseToken"
```

### 12. Organization Admin View Organization Tasks

The earlier examples used a normal `user` token for creating personal tasks. To view all tasks for an organization, log in as an `org_admin`.

```powershell
$orgAdminLoginBody = @{
  org_id = $orgId
  email = "beta.admin@taskmgmt.local"
  password = "Admin@123"
} | ConvertTo-Json

$orgAdminLogin = curl.exe -s -X POST http://127.0.0.1:5000/api/auth/org/login `
  -H "Content-Type: application/json" `
  --data $orgAdminLoginBody | ConvertFrom-Json

$orgAdminToken = $orgAdminLogin.access_token
```

Now use the organization admin token:

```powershell
curl.exe -X GET "http://127.0.0.1:5000/api/orgs/$orgId/tasks" `
  -H "Authorization: Bearer $orgAdminToken"
```

## API Reference

Base URL while running locally:

```text
http://127.0.0.1:5000
```

### Health

| Method | Path | Auth Required | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Basic health check. |
| `GET` | `/health` | No | Basic health check. |

### Authentication

#### Enterprise Login

```http
POST /api/auth/enterprise/login
```

Auth required: no

Request body:

```json
{
  "email": "admin@taskmgmt.local",
  "password": "Admin@123"
}
```

Success response:

```json
{
  "access_token": "JWT_TOKEN_HERE",
  "user": {
    "id": 1,
    "name": "Task Management Admin",
    "email": "admin@taskmgmt.local",
    "role": "enterprise_admin"
  }
}
```

Common errors:

| Status | Reason |
| --- | --- |
| `400` | Email or password missing. |
| `401` | Invalid credentials. |

#### Organization Login

```http
POST /api/auth/org/login
```

Auth required: no

Request body:

```json
{
  "org_id": 1,
  "email": "beta.user@taskmgmt.local",
  "password": "User@123"
}
```

Success response:

```json
{
  "access_token": "JWT_TOKEN_HERE",
  "user": {
    "id": 1,
    "org_id": 1,
    "full_name": "Beta User",
    "email": "beta.user@taskmgmt.local",
    "role": "user",
    "schema_name": "org_beta"
  }
}
```

Common errors:

| Status | Reason |
| --- | --- |
| `400` | `org_id`, email, or password missing. |
| `400` | `org_id` is not an integer. |
| `401` | Invalid credentials. |
| `403` | User account is inactive. |
| `404` | Organization not found or inactive. |

### Enterprise Organization Routes

These routes require an enterprise admin token.

Send:

```http
Authorization: Bearer ENTERPRISE_TOKEN
```

#### List Organizations

```http
GET /api/enterprise/organizations
```

Returns all organizations owned by the logged-in enterprise.

#### Create Organization

```http
POST /api/enterprise/organizations
```

Request body:

```json
{
  "name": "Org Beta"
}
```

What happens internally:

1. The app validates the organization name.
2. The app converts the name to a schema name.
3. The app creates a row in `dbo.organizations`.
4. The app creates the tenant schema.
5. The app creates tenant tables in that schema.

Example response:

```json
{
  "id": 1,
  "enterprise_id": 1,
  "name": "Org Beta",
  "schema_name": "org_beta",
  "created_at": "2026-05-26T23:51:00",
  "is_active": true
}
```

#### Get One Organization

```http
GET /api/enterprise/organizations/{org_id}
```

Example:

```http
GET /api/enterprise/organizations/1
```

#### Update Organization

```http
PUT /api/enterprise/organizations/{org_id}
```

Allowed fields:

```json
{
  "name": "Org Beta Updated",
  "is_active": true
}
```

You can send one field or both fields.

Important: changing the organization `name` does not rename the SQL schema. The schema name stays the same.

#### Deactivate Organization

```http
DELETE /api/enterprise/organizations/{org_id}
```

This does not physically delete the organization row. It sets:

```text
is_active = false
```

This is called a soft delete.

### User Routes

These routes are under:

```text
/api/orgs/{org_id}/users
```

Allowed roles:

- `enterprise_admin`
- `org_admin`

An `org_admin` can only access their own organization.

#### List Users In An Organization

```http
GET /api/orgs/{org_id}/users
```

Example:

```http
GET /api/orgs/1/users
```

#### Create User

```http
POST /api/orgs/{org_id}/users
```

Request body:

```json
{
  "full_name": "Beta User",
  "email": "beta.user@taskmgmt.local",
  "password": "User@123",
  "role": "user"
}
```

Allowed roles for a user:

- `user`
- `org_admin`

Response includes the created user, but the stored password hash is also returned because the row serializer returns the table row. In a production API, you should hide `password_hash` from responses.

#### Update User

```http
PUT /api/orgs/{org_id}/users/{user_id}
```

Allowed fields:

```json
{
  "full_name": "Beta User Updated",
  "email": "beta.updated@taskmgmt.local",
  "password": "NewPassword@123",
  "role": "org_admin",
  "is_active": true
}
```

You can send only the fields you want to update.

#### Deactivate User

```http
DELETE /api/orgs/{org_id}/users/{user_id}
```

This sets:

```text
is_active = false
```

The user row is not physically deleted.

### Task Routes

### My Task Routes

These routes are for organization users and organization admins.

The token must include:

- `schema_name`
- `user_id`

Enterprise admin tokens do not include those values, so enterprise admins cannot use `/api/tasks/my`, `/api/tasks`, or `/api/tasks/{task_id}` directly.

#### List My Tasks

```http
GET /api/tasks/my
```

Returns tasks for the logged-in organization user only.

#### Create My Task

```http
POST /api/tasks
```

Request body:

```json
{
  "title": "First Task",
  "description": "Initial tenant task",
  "task_date": "2026-05-26",
  "hours_spent": 1.5
}
```

Required:

- `title`

Optional:

- `description`
- `task_date`
- `hours_spent`

Do not send `status` during creation. The API rejects it because status is managed by the system on create.

Default status:

```text
pending
```

#### Update My Task

```http
PUT /api/tasks/{task_id}
```

Allowed fields:

```json
{
  "title": "First Task Updated",
  "description": "Updated details",
  "status": "completed",
  "task_date": "2026-05-26",
  "hours_spent": 2.25
}
```

Allowed status values:

- `pending`
- `in_progress`
- `completed`

Important: users can update only their own tasks.

There is currently no `DELETE /api/tasks/{task_id}` route.

### Task Reporting Routes

#### Enterprise Task Report

```http
GET /api/enterprise/tasks
```

Required role:

- `enterprise_admin`

Returns tasks from all organizations owned by the logged-in enterprise.

Each row includes task data, user data, and organization data.

#### Organization Task Report

```http
GET /api/orgs/{org_id}/tasks
```

Allowed roles:

- `enterprise_admin`
- `org_admin`

An `org_admin` can view only their own organization.

## Environment Variables

The app reads settings in `app/config.py`.

### General Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `SECRET_KEY` | `change-me` | Flask secret key. Change this for real deployments. |
| `JWT_SECRET_KEY` | same as `SECRET_KEY` | Secret key used to sign JWT tokens. |
| `JWT_ACCESS_TOKEN_EXPIRES_SECONDS` | `3600` | Token lifetime in seconds. Default is 1 hour. |
| `FLASK_DEBUG` | `false` | Enables Flask debug mode when set to `true`. |
| `FLASK_HOST` | `0.0.0.0` | Host used by `run.py`. |
| `FLASK_PORT` | `5000` | Port used by `run.py`. |

### Database Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | not set | Full database connection string. If set, it overrides other database variables. |
| `USE_DOCKER_SQL_SERVER` | `true` | If true, use the hardcoded Docker SQL Server connection. |
| `DB_DRIVER` | auto-detected or `SQL Server` | ODBC driver name. |
| `DB_HOST` | `127.0.0.1` | SQL Server host. |
| `DB_PORT` | `1433` | SQL Server port. |
| `DB_NAME` | `TaskManagementDB` | Database name. |
| `DB_USER` | not set | SQL username. |
| `DB_PASSWORD` | not set | SQL password. |
| `DB_ENCRYPT` | `no` | SQL Server encryption setting. |
| `DB_TRUST_SERVER_CERTIFICATE` | `yes` | Trust server certificate setting. |
| `SQLALCHEMY_ECHO` | `false` | If true, SQLAlchemy prints SQL queries. Useful for debugging. |

### Recommended Development Settings

For local development with SQL username and password:

```powershell
$env:SECRET_KEY = "dev-secret-change-later"
$env:JWT_SECRET_KEY = "dev-jwt-secret-change-later"
$env:USE_DOCKER_SQL_SERVER = "false"
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "1433"
$env:DB_NAME = "TaskManagementDB"
$env:DB_USER = "sa"
$env:DB_PASSWORD = "YourStrongPass@123"
$env:DB_DRIVER = "ODBC Driver 18 for SQL Server"
$env:DB_ENCRYPT = "no"
$env:DB_TRUST_SERVER_CERTIFICATE = "yes"
$env:FLASK_DEBUG = "true"
python run.py
```

## Sample JSON Files

The project includes small JSON files that make manual API testing easier.

| File | Used For |
| --- | --- |
| `login.json` | Enterprise admin login. |
| `org.json` | Create `Org Alpha`. |
| `org_beta.json` | Create `Org Beta`. |
| `org_update.json` | Rename `Org Alpha`. |
| `org_login.json` | Organization login example. |
| `user_beta.json` | Create a Beta org admin. |
| `user_beta_2.json` | Create a Beta normal user. |
| `user_beta_update.json` | Update a Beta user. |
| `task_create.json` | Create a task. |
| `task_update.json` | Update a task. |

Important: `org_login.json` contains a fixed `org_id`.

```json
{
  "org_id": 4,
  "email": "beta.admin@taskmgmt.local",
  "password": "Admin@123"
}
```

Your organization id may not be `4`. Use the id returned by your create organization request.

## Common Errors And Fixes

### `ModuleNotFoundError: No module named 'flask'`

Cause: dependencies are not installed or the virtual environment is not active.

Fix:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Database Login Fails

Possible causes:

- SQL Server is not running.
- The database `TaskManagementDB` does not exist.
- Wrong username or password.
- Wrong ODBC driver.
- You are using local SQL Server but forgot to set `USE_DOCKER_SQL_SERVER=false`.

Fix:

1. Confirm SQL Server is running.
2. Confirm the database exists.
3. Confirm your environment variables.
4. Confirm your installed ODBC driver name.

### ODBC Driver Error

Example error:

```text
Data source name not found
```

or:

```text
Can't open lib 'ODBC Driver 18 for SQL Server'
```

Cause: the ODBC driver name in your connection string does not match an installed driver.

Fix:

Install Microsoft ODBC Driver for SQL Server or set:

```powershell
$env:DB_DRIVER = "ODBC Driver 17 for SQL Server"
```

if version 17 is installed.

### `Invalid credentials`

Possible causes:

- Wrong email.
- Wrong password.
- Enterprise admin was not seeded.
- Password was inserted as plain text instead of a Werkzeug hash.
- User was created in a different organization.

Fix:

- Make sure the email matches exactly.
- Generate a password hash using Werkzeug.
- Insert the hash into `password_hash`.
- For organization login, make sure `org_id` is correct.

### `Forbidden`

Cause: the logged-in user does not have permission for that route.

Examples:

- Normal `user` trying to create users.
- `org_admin` trying to access another organization.
- Enterprise admin trying to use `/api/tasks/my`.

Fix:

Use the correct account type and token.

### `Organization not found`

Possible causes:

- Wrong `org_id`.
- Organization was deactivated.
- Logged-in org admin is trying to access another organization.

Fix:

List organizations with:

```powershell
curl.exe -X GET http://127.0.0.1:5000/api/enterprise/organizations `
  -H "Authorization: Bearer $enterpriseToken"
```

### `Schema already exists`

Cause: an organization with the same schema name already exists, or a SQL Server schema with that name already exists.

Example:

- `Org Beta`
- `Org-Beta`
- `Org_Beta`

All become:

```text
org_beta
```

Fix:

Use a different organization name or manually clean up the old schema if you are resetting your database.

### `task_date must be YYYY-MM-DD`

Cause: task date is not in ISO format.

Correct:

```json
{
  "task_date": "2026-05-26"
}
```

Incorrect:

```json
{
  "task_date": "26-05-2026"
}
```

### `hours_spent must be numeric`

Correct:

```json
{
  "hours_spent": 2.25
}
```

Incorrect:

```json
{
  "hours_spent": "two hours"
}
```

## Development Notes

### Passwords

Passwords are hashed with Werkzeug before being stored.

User creation uses:

```python
generate_password_hash(password)
```

Login checks passwords with:

```python
check_password_hash(stored_hash, password)
```

This is good because the database does not store plain text passwords.

### Soft Deletes

Organizations and users are not physically deleted.

Instead:

- deleting an organization sets `organizations.is_active = false`
- deleting a user sets `users.is_active = false`

This keeps history in the database and prevents accidental permanent deletion.

### Automatic Table Creation

When the Flask app starts, this code creates the main tables:

```python
Base.metadata.create_all(bind=_engine)
```

When an organization is created, this code creates tenant schema tables:

```python
create_schema_and_tables(connection, schema_name)
```

### No Database Migrations Yet

This project does not currently use Alembic or Flask-Migrate.

That means if you change table definitions later, SQLAlchemy will not automatically update existing tables. For a real project, you should add migrations.

### No Automated Tests Yet

There are no test files currently in this project.

Useful future tests would include:

- enterprise login
- organization creation
- tenant schema creation
- user creation
- org login
- task creation
- task update
- role permission checks

### Production Improvements To Consider Later

These are not required to understand the current project, but they are good next steps:

- Add enterprise registration or a proper seed script.
- Hide `password_hash` in user API responses.
- Add pagination for large user and task lists.
- Add task delete endpoint if needed.
- Add Alembic migrations.
- Add automated tests.
- Add request validation with Marshmallow or Pydantic.
- Add logging.
- Use strong secrets in environment variables.
- Add HTTPS in production.
- Store production secrets securely.

## Beginner Glossary

| Term | Meaning |
| --- | --- |
| API | A backend service that accepts requests and returns responses. |
| Endpoint | A URL path handled by the API, like `/api/tasks`. |
| Route | Flask code that defines what happens for an endpoint. |
| Request body | JSON data sent to the API. |
| Response | Data returned by the API. |
| HTTP method | The action type: `GET`, `POST`, `PUT`, `DELETE`. |
| `GET` | Read data. |
| `POST` | Create data. |
| `PUT` | Update data. |
| `DELETE` | Delete or deactivate data. |
| JWT | A signed login token used to prove who you are. |
| Bearer token | A token sent in the `Authorization` header. |
| Role | A permission level, like `enterprise_admin`, `org_admin`, or `user`. |
| Tenant | A customer or organization using the same app. |
| Schema | A namespace or folder inside SQL Server. |
| ORM | Object-relational mapper. SQLAlchemy can map Python code to database tables. |
| Hash | A protected representation of a password. |
| Soft delete | Marking data inactive instead of physically deleting it. |
| Environment variable | A setting stored outside code, such as `DB_PASSWORD`. |

## Quick Beginner Checklist

Use this checklist when starting from zero:

1. Install Python.
2. Install SQL Server.
3. Install Microsoft ODBC Driver for SQL Server.
4. Create database `TaskManagementDB`.
5. Open PowerShell in this project folder.
6. Create and activate `.venv`.
7. Run `pip install -r requirements.txt`.
8. Set database environment variables if you are not using the default Docker SQL Server setup.
9. Run `python run.py` once so the main tables are created.
10. Generate a password hash.
11. Insert the first enterprise admin into `dbo.enterprises`.
12. Start the API again with `python run.py`.
13. Test `/health`.
14. Log in with `/api/auth/enterprise/login`.
15. Create an organization.
16. Create users inside that organization.
17. Log in as an organization user.
18. Create and update tasks.

Once these steps work, the full project flow is running.
