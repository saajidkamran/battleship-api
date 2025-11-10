# Battleship API

A RESTful API for playing Battleship game, built with TypeScript, Express.js, and following clean architecture principles.

## 🎯 Features

- **Game Management**: Start new games, fire at coordinates, check game status
- **Ship Placement**: Automatic random placement of ships (1 Battleship, 2 Destroyers)
- **Idempotency**: Support for idempotent requests via `Idempotency-Key` header
- **Security**: Helmet.js, CORS, rate limiting, request validation
- **Logging**: Structured logging with Pino
- **Error Handling**: Custom error types with proper HTTP status codes
- **Type Safety**: Full TypeScript implementation
- **Testing**: Unit and integration tests with Jest
- **Caching**: Redis caching layer for improved performance (optional)

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Logging**: Pino
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit
- **Testing**: Jest, Supertest
- **Development**: nodemon, ts-node
- **Caching**: Redis (ioredis)
- **Database**: MySQL (TypeORM)

## 📁 Project Structure

```
battle-ship-api/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── unit/           # Unit tests
│   │   ├── integration/    # Integration tests
│   │   └── helpers/        # Test utilities
│   ├── config/             # Configuration files
│   │   ├── env.ts          # Environment variables
│   │   ├── database.ts     # Database configuration
│   │   ├── redis.ts        # Redis configuration
│   │   ├── gracefulShutdown.ts  # Graceful shutdown handlers
│   │   └── initializeServices.ts # Service initialization
│   ├── controllers/        # Request handlers
│   │   └── gameController.ts
│   ├── middlewares/        # Express middlewares
│   │   ├── errorHandler.ts
│   │   ├── idempotency.ts
│   │   ├── rateLimiter.ts
│   │   ├── requestId.ts
│   │   ├── security.ts
│   │   └── validateRequest.ts
│   ├── models/             # TypeScript interfaces
│   │   └── gameTypes.ts
│   ├── repositories/       # Data access layer
│   │   └── gameRepository.ts
│   ├── routes/             # Route definitions
│   │   └── v1/
│   │       ├── gameRoutes.ts
│   │       └── healthRoutes.ts
│   ├── services/           # Business logic
│   │   ├── gameService.ts
│   │   ├── shipPlacement.ts
│   │   └── cacheService.ts # Redis cache service
│   ├── utils/              # Utility functions
│   │   ├── constants.ts
│   │   ├── errors.ts
│   │   └── logger.ts
│   ├── app.ts              # Express app setup
│   └── index.ts            # Entry point
├── dist/                   # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/saajidkamran/battleship-api.git
cd battle-ship-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
# Create .env file (optional, defaults are provided)
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173

# Database configuration (optional)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=battleship

# Redis configuration (optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

   **Note**: You can use Docker Compose to quickly set up MySQL and Redis:
   ```bash
   docker-compose up -d
   ```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### Health Check
```http
GET /health/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

#### Start New Game
```http
POST /api/v1/game/start
```

**Response:** `201 Created`
```json
{
  "message": "New game started.",
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "gridSize": "10x10",
  "shipsCount": 3
}
```

**Ships:**
- 1 Battleship (5 cells)
- 2 Destroyers (4 cells each)

---

#### Fire at Coordinate
```http
POST /api/v1/game/:id/fire
```

**Headers:**
```
Idempotency-Key: <unique-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coordinate": "A1"
}
```

**Path Parameters:**
- `id` (UUID): Game ID

**Coordinate Format:**
- Range: A1 to J10
- Format: Letter (A-J) + Number (1-10)
- Case insensitive

**Response:** `200 OK`
```json
{
  "coordinate": "A1",
  "result": "hit",
  "sunk": "Battleship",
  "gameStatus": "WON"
}
```

**Possible Results:**
- `"hit"`: Ship was hit
- `"miss"`: No ship at coordinate

**Possible Game Status:**
- `"IN_PROGRESS"`: Game ongoing
- `"WON"`: All ships sunk

**Error Responses:**
- `400 Bad Request`: Invalid coordinate or game ID
- `404 Not Found`: Game not found
- `409 Conflict`: Coordinate already fired or game already won

---

#### Get Game State
```http
GET /api/v1/game/:id/state
```

**Path Parameters:**
- `id` (UUID): Game ID

**Response:** `200 OK`
```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "IN_PROGRESS",
  "shots": ["A1", "B2", "C3"],
  "remainingShips": 2
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID
- `404 Not Found`: Game not found

---

#### Get Recent Games
```http
GET /api/v1/game/recent
```

Returns all games with `IN_PROGRESS` status that were created in the last 24 hours, ordered by creation date (newest first).

**Response:** `200 OK`
```json
{
  "message": "Recent games (last 24 hours)",
  "count": 2,
  "games": [
    {
      "gameId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "IN_PROGRESS",
      "shots": ["A1", "B2"],
      "remainingShips": 2,
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "gameId": "660e8400-e29b-41d4-a716-446655440001",
      "status": "IN_PROGRESS",
      "shots": ["C3"],
      "remainingShips": 3,
      "createdAt": "2024-01-01T11:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `count`: Number of recent games found
- `games`: Array of game objects with:
  - `gameId`: Unique game identifier
  - `status`: Game status (always `IN_PROGRESS` for recent games)
  - `shots`: Array of coordinates that have been fired
  - `remainingShips`: Number of ships that haven't been sunk
  - `createdAt`: Timestamp when the game was created

**Notes:**
- Only returns games with `IN_PROGRESS` status
- Only returns games created within the last 24 hours
- Results are ordered by creation date (newest first)
- Returns empty array if no recent games exist

---

#### Get Games by Status (with Pagination)
```http
GET /api/v1/game/status?status=IN_PROGRESS&page=1&limit=10
```

**Query Parameters:**
- `status` (optional): Filter by game status (`IN_PROGRESS`, `WON`, `LOST`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:** `200 OK`
```json
{
  "message": "Games with status IN_PROGRESS",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "IN_PROGRESS",
      "shots": ["A1", "B2"],
      "ships": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### Delete Game
```http
DELETE /api/v1/game/:id
```

**Path Parameters:**
- `id` (UUID): Game ID

**Response:** `200 OK`
```json
{
  "message": "Game deleted successfully",
  "gameId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID format
- `404 Not Found`: Game not found

---

#### Delete All Games
```http
DELETE /api/v1/game
```

**Response:** `200 OK`
```json
{
  "message": "All games deleted successfully",
  "deletedCount": 5
}
```

---

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 10 requests per minute per IP
- **Request Validation**: Input validation with express-validator
- **Body Size Limit**: 1KB request body limit

## 🧪 Testing

Run tests:
```bash
npm test
```

Test structure:
- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test API endpoints end-to-end

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `debug` (dev) / `info` (prod) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | - |
| `REDIS_DB` | Redis database number | `0` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASS` | MySQL password | `root` |
| `DB_NAME` | MySQL database name | `battleship` |

## Caching with Redis

The API includes an optional Redis caching layer to improve performance.

### Caching Strategy

1. **Individual Game Caching (Cache-Aside Pattern)**
   - Games are cached when retrieved from the database
   - Cache TTL: 1 hour for active games, 24 hours for completed games
   - Cache keys: `game:{gameId}`

2. **Game Lists Caching**
   - Paginated game lists by status are cached
   - Cache TTL: 5 minutes
   - Cache keys: `games:status:{status}:page:{page}:limit:{limit}`

3. **Recent Games Caching**
   - Recent games query is cached
   - Cache TTL: 1 minute
   - Cache key: `games:recent`

4. **Write-Through Pattern**
   - When games are created or updated, cache is updated immediately
   - Database remains the source of truth
   - Cache invalidation happens on deletes and status changes

### Benefits

- **Reduced Database Load**: Frequently accessed games are served from cache
- **Faster Response Times**: Redis is in-memory and much faster than database queries
- **Scalability**: Redis can handle high read loads efficiently
- **Resilience**: App continues to work if Redis is unavailable (graceful degradation)

### Setup

1. **Using Docker Compose** (Recommended):
```bash
docker-compose up -d redis
```

2. **Manual Setup**:
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
redis-server
```

3. **Configure Environment Variables**:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password
REDIS_DB=0
```


### Cache Invalidation

- Game cache is invalidated when a game is deleted
- Game lists are invalidated when games are created, deleted, or status changes
- Recent games cache is invalidated when new games are created or status changes

## Game Rules

- **Grid Size**: 10x10 (A1 to J10)
- **Ships**:
  - 1 Battleship (5 cells)
  - 2 Destroyers (4 cells each)
- **Ship Placement**: Random, non-overlapping
- **Win Condition**: Sink all ships
- **Duplicate Shots**: Not allowed (returns 409 Conflict)

## Idempotency

The API supports idempotent requests for the `fire` endpoint using Redis caching:

1. Include `Idempotency-Key` header with a unique value
2. If the same key is used again, the cached response is returned from Redis
3. Response includes `idempotent: true` flag
4. Idempotency keys are cached for 24 hours
5. **Cache Key**: `idempotency:{idempotencyKey}`

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/game/{gameId}/fire \
  -H "Idempotency-Key: unique-request-id-123" \
  -H "Content-Type: application/json" \
  -d '{"coordinate": "A1"}'
```

**Note**: Idempotency is now using Redis (previously in-memory Map) for production-ready distributed caching.

## Logging

The API uses structured logging with Pino:
- **Development**: Pretty-printed colored logs
- **Production**: JSON formatted logs
- **Log Levels**: debug, info, warn, error

## 🛠️ Development

### Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
npm test         # Run tests
```

### Code Structure

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and game rules
- **Repositories**: Data persistence (currently in-memory)
- **Models**: TypeScript interfaces and types
- **Middlewares**: Cross-cutting concerns (validation, errors, security)


## 🎯 Future Improvements

- [ ] WebSocket support for real-time updates
- [ ] Multiplayer support
- [ ] Game history and statistics
- [ ] Docker containerization
- [ ] CI/CD pipeline

