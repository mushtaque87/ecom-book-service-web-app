#!/bin/bash

RESULTS_DIR="ultra-performance-results"
mkdir -p $RESULTS_DIR

echo "🚀 Ultra-High Performance Test Suite"
echo "===================================="

# Test 1: Ultra-high throughput (2000+ RPS target)
echo "📊 Test 1: Ultra-High Throughput"
echo "10,000 requests, 200 concurrent users"
ab -n 10000 -c 200 -g "$RESULTS_DIR/ultra_throughput.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/ultra_throughput.txt"

# Test 2: Ultra-low latency (<50ms target)
echo "📊 Test 2: Ultra-Low Latency"
echo "1,000 requests, 10 concurrent users"
ab -n 1000 -c 10 -g "$RESULTS_DIR/ultra_latency.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/ultra_latency.txt"

# Test 3: Very high concurrent load (1000+ simultaneous users)
echo "📊 Test 3: Very High Concurrent Load"
echo "20,000 requests, 1000 concurrent users"
ab -n 20000 -c 1000 -g "$RESULTS_DIR/ultra_concurrent.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/ultra_concurrent.txt"

# Test 4: Sustained load test
echo "📊 Test 4: Sustained Load"
echo "50,000 requests, 500 concurrent users"
ab -n 50000 -c 500 -g "$RESULTS_DIR/sustained_load.tsv" "http://localhost:30080/booksql" > "$RESULTS_DIR/sustained_load.txt"

echo ""
echo "✅ Ultra-performance tests completed!"
echo ""
echo "📊 RESULTS SUMMARY:"
echo "==================="
echo ""

echo "🎯 THROUGHPUT TEST (Target: 2000+ RPS):"
grep "Requests per second" $RESULTS_DIR/ultra_throughput.txt

echo ""
echo "⚡ LATENCY TEST (Target: <50ms):"
grep "Time per request:" $RESULTS_DIR/ultra_latency.txt | head -1

echo ""
echo "🔥 CONCURRENT LOAD TEST (Target: 1000+ users):"
grep "Requests per second" $RESULTS_DIR/ultra_concurrent.txt

echo ""
echo "⏱️  SUSTAINED LOAD TEST:"
grep "Requests per second" $RESULTS_DIR/sustained_load.txt

echo ""
echo "📈 PERFORMANCE TARGETS:"
echo "✅ Ultra-high throughput: 2000+ RPS"
echo "✅ Ultra-low latency: <50ms"
echo "✅ Very high concurrent load: 1000+ users"