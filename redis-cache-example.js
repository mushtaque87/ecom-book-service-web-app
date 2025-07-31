const redis = require('redis');
const client = redis.createClient({ host: 'redis-service', port: 6379 });

// Cache strategy for GET /books
app.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, author } = req.query;
    
    // Create cache key
    const cacheKey = `books:${JSON.stringify({ page, limit, genre, author })}`;
    
    // Try Redis first
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT');
      return res.json(JSON.parse(cached));
    }
    
    console.log('❌ Cache MISS - Querying MongoDB');
    
    // Query MongoDB (with WiredTiger cache)
    const [books, total] = await Promise.all([
      Book.find(query).limit(parseInt(limit)).skip(skip).lean(),
      Book.countDocuments(query)
    ]);
    
    const result = {
      books,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    };
    
    // Cache for 5 minutes
    await client.setex(cacheKey, 300, JSON.stringify(result));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Cache invalidation on updates
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    
    // Invalidate cache
    const keys = await client.keys('books:*');
    if (keys.length > 0) {
      await client.del(keys);
      console.log('🗑️ Cache invalidated');
    }
    
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});