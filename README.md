# Banking-api-core

## Project Description

The Banking API Core is a backend application designed to manage banking operations such as user authentication, account management, and transaction processing. It is built using Node.js and Express.js, with MongoDB as the database. The API provides secure endpoints for user registration, login, account creation, and transaction handling.

## API Endpoints
### Authentication Endpoints:
- POST /register: Register a new user.
- POST /login: Log in an existing user.
- POST /logout: Log out the current user.
- POST /refresh: get new access token with refresh token rotation.
- POST /verify-otp: For email verification.
- POST /resend-otp: Resends OTP on user request.
- POST /forgot-password: Sends reset password email.
- POST /reset-password: Resets user password.

### Profile Endpoints:
- GET /get-profile: Fetch all user info
- PUT /update-profile: Set user info

### Account Endpoints:
- POST /: Create a new account (requires authentication).
- GET /: Retrieve all accounts for the authenticated user.
- GET /balance/:accountId: Get the balance of a specific account (requires authentication).

### Transaction Endpoints:
POST /: Create a new transaction (requires authentication).
POST /system/initial-funds: Create an initial funds transaction (requires system user authentication).

# Getting Started

## Prerequisites
### Ensure you have the following installed on your system:

- Node.js (v16 or higher)
- npm (Node Package Manager)
- MongoDB ( remotely or with replicaset locally)

### Starting the project
- clone the repo
```bash
git clone https://github.com/yourusername/banking-api.git
```
- Navigate to the project directory
```bash
cd banking-api
```
- Install dependencies
```bash
npm install
```

- Create a .env file in root directory (follow the `.env.example` file)


- Start the development server
```bash
npm run dev
```