# Webex Call History Viewer

A simple web application that allows you to view call history data from Webex.

## Features

- Real-time call history data from the Webex API
- Filter calls by date range
- Select specific users to view their call history
- View call statistics and details
- Filter calls by type (inbound, outbound, missed)
- Automatic port selection to avoid conflicts

## Prerequisites

- Node.js (version 14 or higher)
- npm
- A Webex account with admin access
- A Webex API bearer token with appropriate permissions

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/D-ignite/webex-cdr.git
   cd webex-cdr
   ```

2. Install dependencies (this will create the node_modules folder)
   ```bash
   npm install
   ```

3. Create a `.env` file with your Webex token (use `.env.example` as a template)
   ```bash
   WEBEX_TOKEN=your-token-here
   PORT=3000
   ```

### Getting a Webex API Token

You'll need a Webex API token with the correct permissions to use this application:

#### Option 1: Personal Token (for testing)
1. Go to [developer.webex.com](https://developer.webex.com/)
2. Sign in with your Webex account
3. Navigate to your profile icon → [My Webex Apps](https://developer.webex.com/my-apps)
4. Click "Create a New App" → "Create an Integration"
5. Fill in the required information:
   - App name: "Webex Call History Viewer"
   - Description: "Application to view Webex call history"
   - Icon: Upload any icon (optional)
   - Redirect URI: http://localhost:3000 (for local testing)
   - Scopes: Select the following permissions:
     - `spark-admin:telephony_calls_read` (for call history)
     - `spark:people_read` (for user information)
6. Submit and copy your "Client ID" and "Client Secret"
7. For simple testing, you can generate a token directly from the [Webex API documentation](https://developer.webex.com/docs/api/getting-started) by clicking "Getting Started" and using the interactive token generator

#### Option 2: Service App Token (for production)
For long-running applications in production:
1. Create an OAuth integration as described above
2. Follow the [Webex OAuth flow documentation](https://developer.webex.com/docs/integrations) to implement proper token management
3. Store the refresh token securely and implement token refresh logic
4. For organizational use, work with your Webex admin to ensure proper permissions

**Note**: Personal tokens expire after 12 hours. For production use, implement proper OAuth token refresh.

## Usage

There are several ways to run the application:

### Standard Start
```bash
npm start
```

### Development Mode (with browser auto-open)
```bash
npm run dev
```

### Testing the API Connection
```bash
npm run test-api
```

### Freeing Up Port 3000 (if occupied)
```bash
npm run kill
```

## Application Structure

- `index.js` - Express server with API endpoints
- `public/` - Frontend files
  - `index.html` - HTML template
  - `main.js` - Frontend JavaScript code
- `test-api.js` - API testing script
- `.env` - Environment variables (not in Git, create locally)
- `.env.example` - Template for creating your .env file
- `package.json` & `package-lock.json` - Dependency definitions
- `.gitignore` - Specifies files Git should ignore

### Repository Structure

This repository follows standard Node.js project conventions:

- **Source code**: All application code is tracked in Git
- **Dependencies**: The `node_modules` folder is NOT tracked in Git (it's in `.gitignore`)
- **Environment-specific config**: The `.env` file with your token is NOT tracked in Git

When you clone the repository and run `npm install`, the dependency manager will look at the `package.json` and `package-lock.json` files to recreate the exact same `node_modules` folder on your machine.

### For Git Beginners

If you're new to Git, here's a quick overview of how to work with this repository:

1. **Clone**: Get a local copy of the repository
   ```bash
   git clone https://github.com/D-ignite/webex-cdr.git
   ```

2. **Setup**: Install dependencies and create your environment
   ```bash
   cd webex-cdr
   npm install
   cp .env.example .env  # Then edit .env with your token
   ```

3. **Make changes**: Edit the files as needed for your environment

4. **Commit & Push**: If you want to contribute changes back
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push origin main
   ```

The `.gitignore` file ensures that your personal settings (like API tokens) and the bulky `node_modules` folder aren't tracked in Git, keeping the repository clean and secure.

## API Endpoints

The application provides the following API endpoints:

- `GET /api/health` - Check API health and connectivity
- `GET /api/users` - Get list of Webex users
- `GET /api/calls` - Get call history with parameters:
  - `startDate` - Start date in ISO format (YYYY-MM-DDT00:00:00.000Z)
  - `endDate` - End date in ISO format (YYYY-MM-DDT23:59:59.999Z)
  - `userId` (optional) - Filter by specific user ID
  - `limit` (optional) - Maximum number of results to return

## Security & Production Deployment

### Security Note
This application stores your Webex bearer token in a local .env file. For production use, implement proper authentication and token management.

### Production Deployment Recommendations

For deploying this application in a production environment:

1. **Token Management**:
   - Implement proper OAuth 2.0 flow with refresh tokens
   - Store tokens securely (not in files)
   - Use a secret management solution (AWS Secrets Manager, HashiCorp Vault, etc.)

2. **Server Setup**:
   - Use a process manager like PM2 or containerize with Docker
   - Set up HTTPS with a proper SSL certificate
   - Use a reverse proxy like Nginx for improved security and performance

3. **Sample Docker Setup**:

   Create a `Dockerfile`:
   ```dockerfile
   FROM node:16
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   # Don't copy .env file to Docker image
   ENV PORT=3000
   # Set token via environment variable or secrets manager
   EXPOSE 3000
   CMD ["node", "index.js"]
   ```

   Build and run:
   ```bash
   docker build -t webex-cdr-app .
   docker run -p 3000:3000 -e WEBEX_TOKEN=your_token_here webex-cdr-app
   ```

4. **Cloud Deployment Options**:
   - AWS Elastic Beanstalk
   - Google Cloud Run
   - Azure App Service
   - Heroku

Remember to set environment variables in your production environment rather than using a .env file.

## Troubleshooting

If you encounter issues with the application:

1. Check your Webex token validity with the test script
   ```bash
   npm run test-api
   ```

2. Verify your token has the necessary permissions:
   - `spark-admin:telephony_calls_read`
   - `spark:people_read`

3. Ensure your date range isn't too wide (Webex may limit results)

4. Check the browser console and server logs for errors

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Webex API Documentation

For more information on the Webex APIs used:
- Telephony Call History: https://developer.webex.com/docs/api/v1/webex-calling-detailed-call-history/get-detailed-call-history
- People API: https://developer.webex.com/docs/api/v1/people