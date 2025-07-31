#!/bin/bash

RESULTS_DIR="performance-comparison"
mkdir -p $RESULTS_DIR

echo "🚀 Starting MongoDB vs PostgreSQL Performance Comparison"
echo "========================================================"

# Test MongoDB endpoint (/books)
echo "📊 Testing MongoDB + Redis Cache (/books)"
echo "Light Load: 100 requests, 10 concurrent"
ab -n 100 -c 10 -g "$RESULTS_DIR/mongodb_light.tsv" "http://localhost:30080/books" > "$RESULTS_DIR/mongodb_light.txt"

echo "Medium Load: 1000 requests, 50 concurrent"
ab -n 1000 -c 50 -g "$RESULTS_DIR/mongodb_medium.tsv" "http://localhost:30080/books" > "$RESULTS_DIR/mongodb_medium.txt"

echo "Heavy Load: 5000 requests, 100 concurrent"
ab -n 5000 -c 100 -g "$RESULTS_DIR/mongodb_heavy.tsv" "http://localhost:30080/books" > "$RESULTS_DIR/mongodb_heavy.txt"

echo ""
echo "📊 Testing PostgreSQL (/booksql)"
echo "Light Load: 100 requests, 10 concurrent"
ab -n 100 -c 10 -g "$RESULTS_DIR/postgres_light.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/postgres_light.txt"

echo "Medium Load: 1000 requests, 50 concurrent"
ab -n 1000 -c 50 -g "$RESULTS_DIR/postgres_medium.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/postgres_medium.txt"

echo "Heavy Load: 5000 requests, 100 concurrent"
ab -n 5000 -c 100 -g "$RESULTS_DIR/postgres_heavy.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/postgres_heavy.txt"

echo ""
echo "✅ Performance comparison completed!"
echo ""
echo "📊 RESULTS SUMMARY:"
echo "==================="
echo ""
echo "MongoDB + Redis Cache:"
grep "Requests per second" $RESULTS_DIR/mongodb_*.txt | sed 's/.*mongodb_/MongoDB /' | sed 's/.txt:/ - /'
echo ""
echo "PostgreSQL:"
grep "Requests per second" $RESULTS_DIR/postgres_*.txt | sed 's/.*postgres_/PostgreSQL /' | sed 's/.txt:/ - /'