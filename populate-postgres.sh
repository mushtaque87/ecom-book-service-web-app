#!/bin/bash

API_URL="http://localhost:30080/booksql"

echo "🚀 Populating PostgreSQL with 100 books..."

# Sample books data
books=(
  '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","isbn":"978-0743273565","publisher":"Scribner","publishDate":"1925-04-10","genre":"Fiction","description":"A story of the fabulously wealthy Jay Gatsby","price":19.99,"pages":180}'
  '{"title":"To Kill a Mockingbird","author":"Harper Lee","isbn":"978-0061120084","publisher":"J.B. Lippincott","publishDate":"1960-07-11","genre":"Fiction","description":"A gripping tale of racial injustice","price":14.99,"pages":281}'
  '{"title":"1984","author":"George Orwell","isbn":"978-0451524935","publisher":"Secker & Warburg","publishDate":"1949-06-08","genre":"Dystopian","description":"A dystopian social science fiction novel","price":13.99,"pages":328}'
)

# Generate more books
authors=("John Smith" "Sarah Johnson" "Michael Brown" "Emily Davis" "David Wilson")
genres=("Fiction" "Mystery" "Romance" "Science Fiction" "Fantasy")
publishers=("Random House" "Penguin" "HarperCollins" "Simon & Schuster" "Macmillan")

for i in {4..100}; do
  author=${authors[$((RANDOM % ${#authors[@]}))]}
  genre=${genres[$((RANDOM % ${#genres[@]}))]}
  publisher=${publishers[$((RANDOM % ${#publishers[@]}))]}
  isbn="978-$((RANDOM % 9000000000 + 1000000000))"
  price=$((RANDOM % 30 + 10))
  pages=$((RANDOM % 500 + 200))
  year=$((RANDOM % 34 + 1990))
  month=$(printf "%02d" $((RANDOM % 12 + 1)))
  day=$(printf "%02d" $((RANDOM % 28 + 1)))
  
  books+=("{\"title\":\"Book Title $i\",\"author\":\"$author\",\"isbn\":\"$isbn\",\"publisher\":\"$publisher\",\"publishDate\":\"$year-$month-$day\",\"genre\":\"$genre\",\"description\":\"A compelling book that will captivate readers\",\"price\":$price,\"pages\":$pages}")
done

count=1
for book in "${books[@]}"; do
  echo "Creating book $count/100 in PostgreSQL..."
  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$book" \
    -s > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ Book $count created successfully"
  else
    echo "❌ Failed to create book $count"
  fi
  
  ((count++))
done

echo "🎉 Finished populating PostgreSQL!"