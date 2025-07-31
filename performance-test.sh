#!/bin/bash

# Performance Testing Script for Book Service API
# Usage: ./performance-test.sh

API_BASE_URL="http://localhost:30080"
RESULTS_DIR="performance-results"

# Create results directory
mkdir -p $RESULTS_DIR

echo "🚀 Starting Performance Tests for Book Service API"
echo "=================================================="

# Test 1: GET /books - Light Load
echo "Test 1: GET /books (100 requests, 10 concurrent)"
ab -n 100 -c 10 -g "$RESULTS_DIR/books_light.tsv" "$API_BASE_URL/books" > "$RESULTS_DIR/books_light.txt"

# Test 2: GET /books - Medium Load  
echo "Test 2: GET /books (1000 requests, 50 concurrent)"
ab -n 1000 -c 50 -g "$RESULTS_DIR/books_medium.tsv" "$API_BASE_URL/books" > "$RESULTS_DIR/books_medium.txt"

# Test 3: GET /books - Heavy Load
echo "Test 3: GET /books (5000 requests, 100 concurrent)"
ab -n 5000 -c 100 -g "$RESULTS_DIR/books_heavy.tsv" "$API_BASE_URL/books" > "$RESULTS_DIR/books_heavy.txt"

# Test 4: POST /books - Create Load Test
echo "Test 4: POST /books (100 requests, 10 concurrent)"
ab -n 100 -c 10 -p book_payload.json -T "application/json" -g "$RESULTS_DIR/books_post.tsv" "$API_BASE_URL/books" > "$RESULTS_DIR/books_post.txt"

echo "✅ Performance tests completed. Results saved in $RESULTS_DIR/"
echo "📊 Summary:"
grep "Requests per second" $RESULTS_DIR/*.txt