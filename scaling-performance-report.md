# Kubernetes Scaling Performance Report

## Infrastructure Changes Applied

### Resource Scaling
- **CPU**: 250m → 500m requests, 500m → 1000m limits (**2x increase**)
- **Memory**: 512Mi → 1Gi requests, 1Gi → 2Gi limits (**2x increase**)
- **Replicas**: 1 → 3 pods (**3x horizontal scaling**)

### HPA Configuration
- **Min Replicas**: 3
- **Max Replicas**: 10
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization

## Performance Test Results Comparison

| Test Scenario | Before Scaling | After Scaling | Change | Improvement |
|---------------|----------------|---------------|---------|-------------|
| **Light Load (100/10)** | 24.30 RPS | 24.37 RPS | +0.07 | **+0.3%** |
| **Medium Load (1000/50)** | 52.61 RPS | 67.18 RPS | +14.57 | **+27.7%** |
| **Heavy Load (5000/100)** | 84.45 RPS | 73.88 RPS | -10.57 | **-12.5%** |
| **POST Load (100/10)** | 45.85 RPS | 31.16 RPS | -14.69 | **-32.0%** |

## Response Time Analysis

| Test Scenario | Before Scaling | After Scaling | Change |
|---------------|----------------|---------------|---------|
| **Light Load** | 412ms | 410ms | **-2ms** |
| **Medium Load** | 950ms | 744ms | **-206ms** |
| **Heavy Load** | 1184ms | 1353ms | **+169ms** |

## Key Findings

### ✅ **Positive Results**
1. **Medium Load Improvement**: 27.7% RPS increase (52.61 → 67.18)
2. **Medium Load Latency**: 22% reduction (950ms → 744ms)
3. **Light Load Stability**: Consistent performance maintained

### ❌ **Unexpected Results**
1. **Heavy Load Degradation**: 12.5% RPS decrease (84.45 → 73.88)
2. **POST Performance Drop**: 32% decrease (45.85 → 31.16)
3. **Heavy Load Latency**: 14% increase (1184ms → 1353ms)

## Root Cause Analysis

### Why Scaling Didn't Help Much

1. **Database Bottleneck**: MongoDB is the limiting factor, not CPU/memory
   - All 3 pods hit the same single MongoDB instance
   - Database queries are the slowest part (returning 4.6KB of data)

2. **Network Overhead**: More pods = more network hops
   - Kong → Service → 3 pods instead of 1 pod
   - Load balancing adds latency

3. **Resource Contention**: 3 pods competing for same node resources
   - Kubernetes node may be resource-constrained
   - Context switching between pods

4. **No Application-Level Optimization**: Core issues remain
   - No pagination (still returning all 100 books)
   - No caching
   - No database indexing

## HPA Status During Tests

```
NAME               REFERENCE                 TARGETS           MINPODS   MAXPODS   REPLICAS
book-service-hpa   Deployment/book-service   59%/80%, 3%/70%   3         10        3
```

- **Memory Usage**: 59% (below 80% threshold)
- **CPU Usage**: 3% (well below 70% threshold)
- **No Auto-Scaling Triggered**: Load wasn't high enough

## Performance Classification

**Current Rating: POOR** ❌

- **Throughput**: Still poor (24-74 RPS)
- **Latency**: Still high (410-1353ms)
- **Scaling Effectiveness**: **Limited** (only 27% improvement in medium load)
- **Resource Utilization**: **Inefficient** (low CPU usage indicates bottleneck elsewhere)

## Lessons Learned

### 1. **Horizontal Scaling Limitations**
- Scaling pods doesn't help when database is the bottleneck
- Network overhead can negate scaling benefits
- Need to identify the actual bottleneck first

### 2. **Database is the Real Problem**
- Single MongoDB instance serving all requests
- No query optimization, indexing, or caching
- 4.6KB response size indicates inefficient queries

### 3. **Resource Scaling Ineffective**
- CPU usage only 3% indicates CPU is not the constraint
- Memory usage 59% shows memory is sufficient
- Throwing more resources at wrong problem

## Next Steps (Priority Order)

### 1. **Database Optimization** (CRITICAL)
```javascript
// Implement pagination
app.get('/books', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  
  const books = await Book.find().limit(limit).skip(skip);
  res.json({ books, pagination: { page, limit } });
});
```

### 2. **Add Database Indexes** (HIGH)
```bash
# Connect to MongoDB pod and add indexes
kubectl exec -it book-mongo-0 -n book-app -- mongo
db.books.createIndex({ "title": 1 })
db.books.createIndex({ "author": 1 })
```

### 3. **Implement Caching** (HIGH)
- Redis cache for GET /books
- 5-minute TTL for book listings

### 4. **Scale Database** (MEDIUM)
- MongoDB replica set
- Read replicas for better performance

## Expected Results After Database Optimization

| Optimization | Expected RPS | Expected Latency |
|--------------|--------------|------------------|
| Pagination (limit=10) | 200+ RPS | <100ms |
| Database Indexing | 300+ RPS | <80ms |
| Redis Caching | 500+ RPS | <50ms |

## Conclusion

**Kubernetes scaling alone is insufficient** when the database is the bottleneck. The 27% improvement in medium load shows scaling can help, but the core issue is inefficient database queries returning large payloads.

**Key Takeaway**: Always identify the actual bottleneck before scaling. In this case, it's the database, not the application layer.

**Next Action**: Focus on database optimization (pagination, indexing, caching) rather than further infrastructure scaling.