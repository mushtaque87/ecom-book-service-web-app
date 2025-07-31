#!/bin/bash

API_URL="http://localhost:30080/books"

books=(
  '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","isbn":"978-0743273565","publisher":"Scribner","publishDate":"1925-04-10","genre":"Fiction","description":"A story of the fabulously wealthy Jay Gatsby","price":19.99,"pages":180}'
  '{"title":"To Kill a Mockingbird","author":"Harper Lee","isbn":"978-0061120084","publisher":"J.B. Lippincott","publishDate":"1960-07-11","genre":"Fiction","description":"A gripping tale of racial injustice","price":14.99,"pages":281}'
  '{"title":"1984","author":"George Orwell","isbn":"978-0451524935","publisher":"Secker & Warburg","publishDate":"1949-06-08","genre":"Dystopian","description":"A dystopian social science fiction novel","price":13.99,"pages":328}'
  '{"title":"Pride and Prejudice","author":"Jane Austen","isbn":"978-0141439518","publisher":"T. Egerton","publishDate":"1813-01-28","genre":"Romance","description":"A romantic novel of manners","price":12.99,"pages":432}'
  '{"title":"The Catcher in the Rye","author":"J.D. Salinger","isbn":"978-0316769174","publisher":"Little, Brown","publishDate":"1951-07-16","genre":"Fiction","description":"A controversial novel about teenage rebellion","price":15.99,"pages":277}'
  '{"title":"Lord of the Flies","author":"William Golding","isbn":"978-0571056866","publisher":"Faber & Faber","publishDate":"1954-09-17","genre":"Fiction","description":"A novel about British boys stranded on an island","price":11.99,"pages":224}'
  '{"title":"The Hobbit","author":"J.R.R. Tolkien","isbn":"978-0547928227","publisher":"George Allen & Unwin","publishDate":"1937-09-21","genre":"Fantasy","description":"A fantasy adventure novel","price":16.99,"pages":310}'
  '{"title":"Fahrenheit 451","author":"Ray Bradbury","isbn":"978-1451673319","publisher":"Ballantine Books","publishDate":"1953-10-19","genre":"Science Fiction","description":"A dystopian novel about book burning","price":13.99,"pages":249}'
  '{"title":"Jane Eyre","author":"Charlotte Brontë","isbn":"978-0141441146","publisher":"Smith, Elder & Co.","publishDate":"1847-10-16","genre":"Gothic Fiction","description":"A bildungsroman following the experiences of its eponymous heroine","price":14.99,"pages":507}'
  '{"title":"Wuthering Heights","author":"Emily Brontë","isbn":"978-0141439556","publisher":"Thomas Cautley Newby","publishDate":"1847-12-01","genre":"Gothic Fiction","description":"A tale of passion and revenge","price":13.99,"pages":416}'
)

# Generate 90 more books
authors=("John Smith" "Sarah Johnson" "Michael Brown" "Emily Davis" "David Wilson" "Lisa Anderson" "Robert Taylor" "Jennifer Martinez" "William Garcia" "Mary Rodriguez")
genres=("Fiction" "Mystery" "Romance" "Science Fiction" "Fantasy" "Thriller" "Historical Fiction" "Biography" "Self-Help" "Business")
publishers=("Random House" "Penguin" "HarperCollins" "Simon & Schuster" "Macmillan" "Hachette" "Scholastic" "Wiley" "Oxford" "Cambridge")

for i in {11..100}; do
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

echo "🚀 Starting to populate 100 books..."

count=1
for book in "${books[@]}"; do
  echo "Creating book $count/100..."
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

echo "🎉 Finished populating books!"