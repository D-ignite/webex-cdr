# Webex CDR Viewer

This is a simple web application that allows you to view detailed call history (CDR) from Webex.

## Features

- Fetch call history data from Webex API
- Filter calls by date range
- Select specific users to view their call history
- View call statistics and details
- Filter calls by type (inbound, outbound, missed)

## Prerequisites

- Node.js (version 14 or higher)
- npm
- A Webex account with access to CDR data
- A Webex API bearer token with appropriate permissions

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. The app is pre-configured with your bearer token in the `.env` file, but if you need to update it:
   ```
   WEBEX_TOKEN=your-token-here
   PORT=3000
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```

2. Open your browser and navigate to http://localhost:3000

3. Use the interface to:
   - Select a date range
   - Choose which users to include
   - Set the maximum number of results
   - Filter calls by type (inbound, outbound, missed)

## API Endpoints

The application provides two API endpoints:

- `GET /api/users` - Retrieves a list of Webex users
- `GET /api/cdr` - Retrieves detailed call history with parameters:
  - `startDate` - Start date in ISO format (YYYY-MM-DD)
  - `endDate` - End date in ISO format (YYYY-MM-DD)
  - `userId` (optional) - Filter by specific user ID
  - `limit` (optional) - Maximum number of results to return

## Security Note

This application stores your Webex bearer token in a local .env file. For production use, implement proper authentication and token management.

## Webex API Documentation

For more information on the Webex Detailed Call History API, see:
https://developer.webex.com/docs/api/v1/reports-detailed-call-history/get-detailed-call-history