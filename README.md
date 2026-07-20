# EarthFateApi

This repository will provide the API for an older project that lost access to the API it previously used.

The related game project can be found here:

https://github.com/BarreiroReSird/EarthFateGame

The goal is to rebuild the backend needed by that project and keep it under this repository going forward.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Running the API

```bash
node API/server.js
```

The API will be available at `http://localhost:3000`

## Available Endpoints

- `POST /signup` - Register a new user (with bcrypt password hashing)
- `POST /login` - Login with username and password (with bcrypt verification)
- `GET /getRandomChar` - Get a random character
- `POST /createChart` - Create a new character (with stats validation)
- `GET /getChar?PlayerID=ID` - Get character by ID
- `POST /updateChart` - Update character stats (with owner permission check)

## Dependencies

- express - Web framework
- cors - Cross-origin resource sharing
- body-parser - Request body parsing
- bcrypt - Password hashing

## Roadmap

- [DONE] Environment setup and basic API with all endpoints
- [TODO] Refactor to layered architecture (controllers, services, models, routes)
- [TODO] Implement data persistence
- [TODO] Add unit and integration tests
- [TODO] API documentation (Swagger/OpenAPI)
- [TODO] Angular integration
- [TODO] Deployment

## Development Notes

The current implementation uses in-memory storage. Data persistence will be added in the next phase.

The code is currently in a monolithic structure (`API/server.js`) and will be refactored into a professional layered architecture (controllers, services, models, routes) soon.
