const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://mongo:mongo123@localhost:27017/bookdb?authSource=admin';

async function addIndexes() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bookdb');
    const collection = db.collection('books');
    
    // Create indexes for better query performance
    const indexes = [
      { title: 1 },
      { author: 1 },
      { genre: 1 },
      { publishDate: -1 },
      { price: 1 },
      { createdAt: -1 },
      { title: 'text', author: 'text', description: 'text' } // Text search index
    ];
    
    console.log('Creating indexes...');
    
    for (const index of indexes) {
      try {
        const result = await collection.createIndex(index);
        console.log(`✅ Created index: ${JSON.stringify(index)} -> ${result}`);
      } catch (error) {
        console.log(`⚠️  Index may already exist: ${JSON.stringify(index)}`);
      }
    }
    
    // List all indexes
    const existingIndexes = await collection.listIndexes().toArray();
    console.log('\n📋 Current indexes:');
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 Index creation completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addIndexes();