# Battleship API

A RESTful API for playing Battleship game, built with TypeScript, Express.js, and following clean architecture principles.

This API is production-ready with:
-  **Transaction Management**: Database transactions with pessimistic locking for data consistency
-  **Health Monitoring**: Comprehensive health check endpoint with service status
-  **Graceful Shutdown**: Proper cleanup of connections and resources
-  **Error Handling**: Robust error handling with proper HTTP status codes
-  **Security**: Helmet.js, CORS, rate limiting, request timeout, input validation
-  **Caching**: Redis caching with graceful degradation
-  **Connection Management**: Retry logic with exponential backoff
-  **Environment Validation**: Comprehensive validation of all environment variables
-  **Production Safety**: Non-blocking Redis operations, connection pooling, request timeout

For detailed information about production improvements, see [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md).

## 🎯 Features

- **Game Management**: Start new games, fire at coordinates, check game status
- **Ship Placement**: Automatic random placement of ships (1 Battleship, 2 Destroyers)
- **Idempotency**: Support for idempotent requests via `Idempotency-Key` header
- **Security**: Helmet.js, CORS, rate limiting, request validation, request timeout
- **Logging**: Structured logging with Pino
- **Error Handling**: Custom error types with proper HTTP status codes
- **Type Safety**: Full TypeScript implementation with strict mode
- **Testing**: Unit and integration tests with Jest
- **Caching**: Redis caching layer for improved performance (optional, graceful degradation)
- **Database**: MySQL with TypeORM, transaction management, connection pooling
- **Health Monitoring**: Comprehensive health check endpoint with service status
- **Production Ready**: Graceful shutdown, connection retries, error handling, transaction management

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

## Installed Packages

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `cors` | ^2.8.5 | Middleware for enabling Cross-Origin Resource Sharing (CORS) |
| `dotenv` | ^17.2.3 | Loads environment variables from `.env` file |
| `express` | ^5.1.0 | Fast, unopinionated web framework for Node.js |
| `express-rate-limit` | ^8.2.1 | Basic rate-limiting middleware for Express |
| `express-validator` | ^7.3.0 | Set of Express.js middlewares for validation and sanitization |
| `helmet` | ^8.1.0 | Helps secure Express apps by setting various HTTP headers |
| `ioredis` | ^5.8.2 | Robust, performance-focused Redis client for Node.js |
| `mysql2` | ^3.15.3 | MySQL client for Node.js with promise support |
| `pino` | ^10.1.0 | Fast JSON logger for Node.js |
| `pino-pretty` | ^13.1.2 | Prettifies Pino log output for development |
| `reflect-metadata` | ^0.2.2 | Polyfill for Metadata Reflection API (required by TypeORM) |
| `typeorm` | ^0.3.27 | Object-Relational Mapping (ORM) library for TypeScript and JavaScript |
| `uuid` | ^13.0.0 | Generate RFC4122 UUIDs (v1, v4, v5) |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@types/cors` | ^2.8.19 | TypeScript type definitions for `cors` |
| `@types/express` | ^5.0.5 | TypeScript type definitions for `express` |
| `@types/ioredis` | ^5.0.0 | TypeScript type definitions for `ioredis` |
| `@types/jest` | ^30.0.0 | TypeScript type definitions for `jest` |
| `@types/node` | ^24.10.0 | TypeScript type definitions for Node.js |
| `@types/supertest` | ^6.0.3 | TypeScript type definitions for `supertest` |
| `jest` | ^30.2.0 | JavaScript testing framework |
| `nodemon` | ^3.1.10 | Monitors for file changes and automatically restarts the server |
| `supertest` | ^7.1.4 | HTTP assertions library for testing Node.js HTTP servers |
| `ts-jest` | ^29.4.5 | TypeScript preprocessor for Jest |
| `ts-node` | ^10.9.2 | TypeScript execution engine for Node.js |
| `typescript` | ^5.9.3 | TypeScript compiler and language services |

### Package Installation

To install all dependencies, run:
```bash
npm install
```

This will install all production and development dependencies listed above.

## Project Structure

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
│   │   ├── requestTimeout.ts  # Request timeout middleware
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
│   │   ├
│   │   ├── errors.ts
│   │   └── logger.ts
│   ├── app.ts              # Express app setup
│   └── index.ts            # Entry point
├── dist/                   # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

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

3. Set up environment variables:
```bash
# Create .env file (optional, defaults are provided)
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_MAX=10

# Database configuration (required in production)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=battleship
DB_POOL_SIZE=10
DB_SSL=false

# Redis configuration (optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Note**: In production mode, database configuration (DB_HOST, DB_USER, DB_PASS, DB_NAME) is required. The server will fail to start if the database connection fails.

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

**Response:** `200 OK` (healthy) or `503 Service Unavailable` (degraded)

**Healthy Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**Degraded Response (503):**
```json
{
  "status": "degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "services": {
    "database": "error",
    "redis": "disconnected"
  }
}
```

**Service Status Values:**
- `connected`: Service is connected and operational
- `disconnected`: Service is not connected (Redis only, optional service)
- `error`: Service connection failed or error occurred

**Notes:**
- In production, the endpoint returns `503` if any required service (database) is unavailable
- Redis is optional; missing Redis does not cause degraded status in development
- Database connectivity is verified with a `SELECT 1` query
- Redis connectivity is verified with a `PING` command

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

- **Helmet.js**: Security headers for protection against common vulnerabilities
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 10 requests per minute per IP (configurable via `RATE_LIMIT_MAX`)
- **Request Validation**: Input validation with express-validator
- **Body Size Limit**: 1KB request body limit
- **Request Timeout**: 30 seconds timeout for requests (configurable via `REQUEST_TIMEOUT_MS`)
- **Environment Validation**: Comprehensive validation of all environment variables
- **Error Sanitization**: Sensitive error details hidden in production

## 🧪 Testing

Run tests:
```bash
npm test
```

Test structure:
- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test API endpoints end-to-end

## Environment Variables

| Variable | Description | Default | Required (Production) | Validation |
|----------|-------------|---------|----------------------|------------|
| `PORT` | Server port | `3000` | No | 1-65535 |
| `NODE_ENV` | Environment (development/production/test) | `development` | No | development/production/test |
| `LOG_LEVEL` | Logging level | `debug` (dev) / `info` (prod) | No | debug/info/warn/error/fatal |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` | No | - |
| `REQUEST_TIMEOUT_MS` | Request timeout in milliseconds | `30000` | No | Positive integer |
| `RATE_LIMIT_MAX` | Maximum requests per window | `10` | No | Positive integer |
| `REDIS_HOST` | Redis server host | `localhost` | No | - |
| `REDIS_PORT` | Redis server port | `6379` | No | 1-65535 |
| `REDIS_PASSWORD` | Redis password (optional) | - | No | - |
| `REDIS_DB` | Redis database number | `0` | No | Non-negative integer |
| `DB_HOST` | MySQL host | `localhost` | **Yes** | - |
| `DB_PORT` | MySQL port | `3306` | No | 1-65535 |
| `DB_USER` | MySQL username | `root` | **Yes** | - |
| `DB_PASS` | MySQL password | `root` | **Yes** | - |
| `DB_NAME` | MySQL database name | `battleship` | **Yes** | - |
| `DB_POOL_SIZE` | Database connection pool size | `10` | No | Positive integer |
| `DB_SSL` | Enable SSL for database connection | `false` | No | true/false |
| `DB_SSL_REJECT_UNAUTHORIZED` | Reject unauthorized SSL certificates | `true` | No | true/false |

### Environment Variable Validation

All environment variables are validated at startup:
- **Port numbers** (PORT, DB_PORT, REDIS_PORT): Must be between 1 and 65535
- **LOG_LEVEL**: Must be one of: debug, info, warn, error, fatal
- **NODE_ENV**: Must be one of: development, production, test
- **Pool sizes**: Must be positive integers
- **Production requirements**: Database configuration (DB_HOST, DB_USER, DB_PASS, DB_NAME) is required in production mode

### Production Mode

In production mode (`NODE_ENV=production`):
- **Database connection is required**: Server will fail to start if database connection fails
- **Enhanced error handling**: Sensitive error details are hidden from responses
- **Strict validation**: All required environment variables must be set
- **Health check**: Returns `503` if services are unavailable

In development mode:
- **Database is optional**: Server can start without database (for testing)
- **Detailed errors**: Full error details and stack traces in responses
- **Flexible configuration**: Missing optional services are allowed

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
- Uses Redis `SCAN` instead of `KEYS` for production safety (non-blocking)
- Batch processing for efficient cache invalidation (100 keys at a time)

### Production Safety

- **Non-blocking operations**: Uses `SCAN` instead of `KEYS` to avoid blocking Redis
- **Graceful degradation**: Application continues to work if Redis is unavailable
- **Connection retry**: Automatic reconnection with exponential backoff
- **Queue management**: Commands are queued during connection establishment
- **Timeout handling**: 5-second timeout for initial connection

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
- **Log Levels**: debug, info, warn, error, fatal
- **Request Tracking**: Each request has a unique request ID (X-Request-ID header)
- **Error Context**: Errors include request ID, path, method, and error details
- **Structured Data**: All logs include metadata for better observability

## Database & Transactions

### Transaction Management

The API uses database transactions to ensure data consistency:
- **Atomic Operations**: Game state updates are wrapped in transactions
- **Pessimistic Locking**: Prevents race conditions when multiple requests fire simultaneously
- **Cache Consistency**: Cache is updated only after transaction commits successfully
- **Error Handling**: Transactions are automatically rolled back on errors

### Connection Management

- **Connection Pooling**: Configurable connection pool (default: 10 connections)
- **Retry Logic**: Exponential backoff with jitter for connection retries
- **Production Mode**: Server fails to start if database connection fails
- **Development Mode**: Server can start without database (for testing)
- **Health Monitoring**: Database connectivity is checked in health endpoint

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
- **Repositories**: Data access layer with caching
- **Models**: TypeORM entities and TypeScript interfaces
- **Middlewares**: Cross-cutting concerns (validation, errors, security, timeout)
- **Config**: Configuration files (database, Redis, environment)

### Architecture Principles

- **Clean Architecture**: Separation of concerns (controllers, services, repositories)
- **Dependency Injection**: Services depend on abstractions
- **Error Handling**: Custom error types with proper HTTP status codes
- **Transaction Management**: Database transactions for data consistency
- **Caching Strategy**: Cache-aside pattern with Redis
- **Graceful Degradation**: Application works without optional services (Redis)


## 🚀 Production Deployment

### Prerequisites

1. **Node.js**: v18 or higher
2. **MySQL**: 8.0 or higher
3. **Redis**: 7.0 or higher (optional, for caching)
4. **Environment Variables**: Set all required variables (see Environment Variables section)

### Deployment Steps

1. **Set Environment Variables**:
```bash
export NODE_ENV=production
export PORT=3000
export DB_HOST=your-db-host
export DB_USER=your-db-user
export DB_PASS=your-db-password
export DB_NAME=battleship
export REDIS_HOST=your-redis-host
export REDIS_PORT=6379
export LOG_LEVEL=info
export CORS_ORIGIN=https://your-frontend-domain.com
```

2. **Build the Application**:
```bash
npm install
npm run build
```

3. **Start the Server**:
```bash
npm start
```

### Production Checklist

- [x] Set `NODE_ENV=production`
- [x] Configure database connection
- [x] Configure Redis connection (optional)
- [x] Set proper CORS origins
- [x] Configure rate limiting
- [x] Set up health check monitoring
- [x] Configure logging level (info/warn/error)
- [x] Set up SSL/TLS certificates
- [x] Configure database connection pooling
- [x] Set up backup strategy for database
- [x] Configure monitoring and alerting
- [x] Test graceful shutdown
- [x] Verify health check endpoint
- [x] Test error handling and logging

### Graceful Shutdown

The API supports graceful shutdown:
- **SIGTERM/SIGINT**: Server stops accepting new connections
- **Connection Cleanup**: Database and Redis connections are closed properly
- **Timeout**: Force shutdown after 10 seconds if cleanup takes too long
- **Error Handling**: Errors during shutdown are logged but don't prevent shutdown

### Monitoring

- **Health Check**: Monitor `/health/health` endpoint
- **Logging**: Structured JSON logs in production
- **Request Tracking**: Each request has a unique request ID
- **Error Tracking**: All errors are logged with context
- **Service Status**: Health check returns service connectivity status

## 🎯 Future Improvements

- [ ] Database migrations with TypeORM
- [ ] API response compression middleware
- [ ] Error tracking integration (Sentry)
- [ ] OpenAPI/Swagger documentation
- [ ] Load testing and performance optimization
- [ ] WebSocket support for real-time updates
- [ ] Multiplayer support
- [ ] Game history and statistics
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] API versioning strategy
- [ ] Rate limiting per user/API key
- [ ] Request/response logging middleware
- [ ] Metrics and observability (Prometheus, Grafana)

