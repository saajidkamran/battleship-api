# Caching Strategy Documentation

## Overview
This API uses Redis for caching to improve performance and reduce database load. The caching layer is optional - if Redis is unavailable, the app continues to work without caching (graceful degradation).


### 1. Individual Games (`game:{gameId}`)
- **When**: Cached when a game is retrieved from the database
- **TTL**: 
  - Active games (IN_PROGRESS): 1 hour (3600 seconds)
  - Completed games (WON/LOST): 24 hours (86400 seconds)
- **Pattern**: Cache-Aside (Lazy Loading)
- **Invalidation**: 
  - When game is deleted
  - When game is updated (cache is refreshed)

**Example Cache Key**: `game:abc-123-def-456`

**Flow**:
```
1. Request comes in for game ID "abc-123"
2. Check Redis cache first
3. If found → return from cache (fast!)
4. If not found → query database
5. Store result in cache for future requests
6. Return result
```

### 2. Game Lists by Status (`games:status:{status}:page:{page}:limit:{limit}`)
- **When**: Cached when games are queried by status with pagination
- **TTL**: 5 minutes (300 seconds)
- **Pattern**: Cache-Aside
- **Invalidation**: 
  - When games are created
  - When games are deleted
  - When game status changes
  - All list caches are invalidated together

**Example Cache Keys**:
- `games:status:IN_PROGRESS:page:1:limit:10`
- `games:status:WON:page:1:limit:10`
- `games:status:all:page:2:limit:20`

**Flow**:
```
1. Request: GET /games?status=IN_PROGRESS&page=1&limit=10
2. Check cache for key: games:status:IN_PROGRESS:page:1:limit:10
3. If found → return from cache
4. If not found → query database
5. Cache result with 5-minute TTL
6. Return result
```

### 3. Recent Games (`games:recent`)
- **When**: Cached when recent games (last 24 hours, IN_PROGRESS) are queried
- **TTL**: 1 minute (60 seconds)
- **Pattern**: Cache-Aside
- **Invalidation**: 
  - When new games are created
  - When game status changes to WON/LOST
  - Short TTL ensures freshness

**Cache Key**: `games:recent`

**Flow**:
```
1. Request: GET /games/recent
2. Check cache for key: games:recent
3. If found → return from cache
4. If not found → query database (last 24 hours, IN_PROGRESS)
5. Cache result with 1-minute TTL
6. Return result
```

## Caching Patterns Used

### Cache-Aside (Lazy Loading)
- **Read Flow**: Check cache → if miss, load from DB → store in cache → return
- **Write Flow**: Write to DB → update/invalidate cache
- **Advantages**: 
  - Cache failures don't break the app
  - Only frequently accessed data is cached
  - Simple to implement

### Write-Through
- **Flow**: Write to DB → immediately update cache
- **Used for**: Game creation and updates
- **Advantages**: Cache is always consistent with database

## Cache Invalidation Strategy

### When Games are Created:
- ✅ Cache the new game
- ✅ Invalidate all game list caches
- ✅ Invalidate recent games cache

### When Games are Updated (e.g., fire at coordinate):
- ✅ Update game cache with new state
- ✅ If status changes (e.g., to WON), invalidate game lists

### When Games are Deleted:
- ✅ Remove game from cache
- ✅ Invalidate all game list caches
- ✅ Invalidate recent games cache

## Idempotency Caching

**Current Status**: ✅ Using Redis for production-ready distributed caching

**What it does**:
- Stores API responses for idempotent requests
- Uses `Idempotency-Key` header
- Prevents duplicate processing of the same request
- Works across multiple server instances

**Cache Key Pattern**: `idempotency:{idempotencyKey}`
**TTL**: 24 hours (86400 seconds)

**Flow**:
```
1. Request comes with Idempotency-Key header
2. Check Redis cache for the key
3. If found → return cached response immediately (idempotent: true)
4. If not found → process request → cache response → return
5. Next duplicate request returns cached response
```

**Benefits**:
- Prevents duplicate operations
- Fast response for duplicate requests (~1-2ms)
- Distributed system support (shared Redis cache)
- Graceful degradation if Redis is unavailable

## Performance Benefits

### Without Caching:
- Every game retrieval: Database query (~10-50ms)
- Every game list: Database query with joins (~50-100ms)
- Database load: High with many concurrent requests

### With Caching:
- Cache hit: Redis lookup (~1-2ms) ⚡
- Cache miss: Database query + cache store
- Database load: Significantly reduced
- Response time: 10-50x faster for cached data

## Redis Configuration

### Default Settings:
- **Host**: localhost
- **Port**: 6379
- **Database**: 0
- **Connection**: Lazy connect (connects on first use)
- **Retry Strategy**: Exponential backoff with jitter
- **Offline Queue**: Disabled (fails fast if Redis is down)

### Environment Variables:
```bash
REDIS_HOST=localhost      # Redis server host
REDIS_PORT=6379          # Redis server port
REDIS_PASSWORD=          # Redis password (optional)
REDIS_DB=0               # Redis database number
```

## Monitoring Cache Performance

### Key Metrics to Monitor:
1. **Cache Hit Rate**: % of requests served from cache
2. **Cache Miss Rate**: % of requests that required DB lookup
3. **Redis Memory Usage**: How much memory Redis is using
4. **Response Times**: Compare cached vs non-cached responses

### Redis Commands for Monitoring:
```bash
# Check Redis connection
redis-cli ping

# Check memory usage
redis-cli info memory

# Check number of keys
redis-cli dbsize

# Monitor Redis commands in real-time
redis-cli monitor

# Check specific cache keys
redis-cli keys "game:*"
redis-cli keys "games:*"
```

## Production Considerations

1. **Redis Persistence**: Enable AOF (Append Only File) for durability
2. **High Availability**: Use Redis Sentinel or Cluster
3. **Memory Management**: Set maxmemory and eviction policy
4. **Security**: Use password authentication
5. **Monitoring**: Set up alerts for Redis downtime
6. **TTL Tuning**: Adjust TTLs based on usage patterns

## Cache Key Naming Convention

```
game:{gameId}                                    # Single game
games:status:{status}:page:{page}:limit:{limit}  # Paginated games
games:recent                                     # Recent games
idempotency:{idempotencyKey}                     # Idempotency (future)
```

## Error Handling

- **Redis Down**: App continues to work, all requests go to database
- **Cache Failures**: Logged as warnings, don't break the app
- **Connection Errors**: Graceful degradation, automatic retry on next request

