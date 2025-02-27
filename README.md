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

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with your Webex token (use `.env.example` as a template)
   ```bash
   WEBEX_TOKEN=your-token-here
   PORT=3000
   ```

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

## API Endpoints

The application provides the following API endpoints:

- `GET /api/health` - Check API health and connectivity
- `GET /api/users` - Get list of Webex users
- `GET /api/calls` - Get call history with parameters:
  - `startDate` - Start date in ISO format (YYYY-MM-DDT00:00:00.000Z)
  - `endDate` - End date in ISO format (YYYY-MM-DDT23:59:59.999Z)
  - `userId` (optional) - Filter by specific user ID
  - `limit` (optional) - Maximum number of results to return

## Security Note

This application stores your Webex bearer token in a local .env file. For production use, implement proper authentication and token management.

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