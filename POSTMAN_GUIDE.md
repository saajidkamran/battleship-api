# Postman Collection Guide

## Importing the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select `postman_collection.json` file
4. Collection will be imported with all endpoints

## Setting Up Environment Variables

### Option 1: Collection Variables (Recommended)
The collection includes variables that you can set:
- `baseUrl`: `http://localhost:3000/api/v1` (default)
- `gameId`: Set this after starting a new game

### Option 2: Postman Environment
Create a new environment in Postman:
- `baseUrl`: `http://localhost:3000/api/v1`
- `gameId`: (will be set automatically after starting a game)

## Testing Workflow

### Step 1: Health Check
```
GET /api/v1/health/health
```
**Purpose**: Verify API is running
**Expected**: `200 OK` with health status

### Step 2: Start a New Game
```
POST /api/v1/game/start
```
**Purpose**: Create a new game
**Response**: 
```json
{
  "message": "New game started.",
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "gridSize": "10x10",
  "shipsCount": 3
}
```
**Action**: Copy the `gameId` and set it as collection variable `{{gameId}}`

### Step 3: Get Game State
```
GET /api/v1/game/{{gameId}}/state
```
**Purpose**: Check current game status
**Expected**: Game state with shots and remaining ships

### Step 4: Fire at Coordinates
```
POST /api/v1/game/{{gameId}}/fire
Headers:
  Idempotency-Key: fire-{{$randomUUID}}
  Content-Type: application/json
Body:
{
  "coordinate": "A1"
}
```
**Purpose**: Fire at a coordinate (A1-J10)
**Expected**: Hit or miss result

### Step 5: Test Idempotency
```
POST /api/v1/game/{{gameId}}/fire
Headers:
  Idempotency-Key: fire-test-same-key
  Content-Type: application/json
Body:
{
  "coordinate": "A1"
}
```
**First Request**: Processes normally
**Second Request** (same key): Returns cached response with `idempotent: true`

### Step 6: Query Games
```
GET /api/v1/game/recent
GET /api/v1/game/status?status=IN_PROGRESS&page=1&limit=10
```
**Purpose**: Test caching for game queries
**Expected**: Cached responses on subsequent requests

## Endpoint Details

### 1. Health Check
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/health/health`
- **Headers**: None
- **Body**: None
- **Response**: Health status

### 2. Start New Game
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/game/start`
- **Headers**: `Content-Type: application/json`
- **Body**: None
- **Response**: Game ID and game info

### 3. Get Game State
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/game/{{gameId}}/state`
- **Headers**: None
- **Body**: None
- **Response**: Game state (status, shots, remaining ships)
- **Caching**: ✅ Cached for 1 hour (active) or 24 hours (completed)

### 4. Fire at Coordinate
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/game/{{gameId}}/fire`
- **Headers**: 
  - `Content-Type: application/json`
  - `Idempotency-Key: <unique-key>` (Required!)
- **Body**: 
```json
{
  "coordinate": "A1"
}
```
- **Response**: Fire result (hit/miss, sunk ship, game status)
- **Idempotency**: ✅ Cached for 24 hours
- **Coordinates**: A1-J10 (case insensitive)

### 5. Get Recent Games
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/game/recent`
- **Headers**: None
- **Body**: None
- **Response**: Recent games (last 24 hours, IN_PROGRESS)
- **Caching**: ✅ Cached for 1 minute

### 6. Get Games by Status
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/game/status?status=IN_PROGRESS&page=1&limit=10`
- **Headers**: None
- **Body**: None
- **Query Parameters**:
  - `status` (optional): IN_PROGRESS, WON, LOST
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
- **Response**: Paginated games
- **Caching**: ✅ Cached for 5 minutes

### 7. Delete Game
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/v1/game/{{gameId}}`
- **Headers**: None
- **Body**: None
- **Response**: Deletion confirmation
- **Cache Invalidation**: ✅ Invalidates all related caches

### 8. Delete All Games
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/v1/game`
- **Headers**: None
- **Body**: None
- **Response**: Deletion count
- **Cache Invalidation**: ✅ Invalidates all caches

## Testing Caching

### Test Game Caching
1. Get game state: `GET /game/{{gameId}}/state`
2. Get same game state again (should be faster - cached)
3. Check Redis: `redis-cli get "game:{{gameId}}"`

### Test Game List Caching
1. Get games: `GET /game/status?status=IN_PROGRESS&page=1&limit=10`
2. Get same games again (should be faster - cached)
3. Create a new game (cache should be invalidated)
4. Get games again (should query database, then cache)

### Test Idempotency
1. Fire at coordinate with key "test-key-1"
2. Fire at same coordinate with SAME key "test-key-1"
3. Second request should return cached response with `idempotent: true`
4. Check Redis: `redis-cli get "idempotency:test-key-1"`

## Testing Scenarios

### Scenario 1: Complete Game Flow
1. Start new game
2. Get game state
3. Fire at A1, B1, C1... (test different coordinates)
4. Get game state after each shot
5. Continue until game is won
6. Get game state (should show WON status)

### Scenario 2: Idempotency Testing
1. Start new game
2. Fire at A1 with Idempotency-Key: "test-key-1"
3. Fire at A1 again with SAME key "test-key-1"
4. Verify second response has `idempotent: true`
5. Verify game state shows A1 fired only once

### Scenario 3: Caching Testing
1. Start multiple games
2. Get game state for each (first request - cache miss)
3. Get game state again (second request - cache hit, should be faster)
4. Query games by status (first request - cache miss)
5. Query games by status again (second request - cache hit)
6. Create new game (cache should be invalidated)
7. Query games again (should query database, then cache)

### Scenario 4: Error Handling
1. Try to fire at invalid coordinate (Z99) - should return 400
2. Try to fire at coordinate twice (without idempotency) - should return 409
3. Try to get game with invalid ID - should return 404
4. Try to fire without Idempotency-Key - should return 400

## Coordinate Format

- **Valid**: A1-J10
- **Format**: Letter (A-J) + Number (1-10)
- **Case**: Insensitive (a1 = A1)
- **Examples**: 
  - ✅ A1, B2, C3, J10
  - ❌ Z1, A11, 1A

## Common Issues

### Issue: "Missing Idempotency-Key header"
**Solution**: Add `Idempotency-Key` header to fire request

### Issue: "Game not found"
**Solution**: Check that gameId is correct and game exists

### Issue: "Coordinate already fired"
**Solution**: Use a different coordinate or use Idempotency-Key to retry

### Issue: Caching not working
**Solution**: 
1. Check Redis is running: `redis-cli ping`
2. Check Redis connection in server logs
3. Verify environment variables are set

## Tips

1. **Use Collection Variables**: Set `gameId` after starting a game
2. **Test Idempotency**: Use the same Idempotency-Key twice
3. **Monitor Cache**: Use Redis CLI to check cached data
4. **Check Logs**: Server logs show cache hits/misses
5. **Use Different Keys**: Each fire request should have unique Idempotency-Key (unless testing duplicates)

## Redis Commands for Testing

```bash
# Check Redis is running
redis-cli ping

# See all cached games
redis-cli keys "game:*"

# See all cached game lists
redis-cli keys "games:*"

# See all idempotency keys
redis-cli keys "idempotency:*"

# Get a specific cached game
redis-cli get "game:your-game-id"

# Get a specific idempotency response
redis-cli get "idempotency:your-key"

# Check TTL of a key
redis-cli ttl "game:your-game-id"

# Clear all caches (use with caution!)
redis-cli flushdb
```

## Expected Response Times

- **Cache Hit**: ~1-2ms (Redis lookup)
- **Cache Miss**: ~10-50ms (Database query)
- **Idempotency Hit**: ~1-2ms (Cached response)
- **First Request**: ~10-50ms (Process + cache)

## Summary

This Postman collection includes all endpoints for testing:
- ✅ Health check
- ✅ Game management (start, get state, fire)
- ✅ Game queries (recent, by status)
- ✅ Game deletion
- ✅ Idempotency testing
- ✅ Caching testing

Happy Testing! 🚀

