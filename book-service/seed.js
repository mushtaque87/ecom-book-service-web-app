const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/bookdb';

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0743273565",
    publisher: "Scribner",
    publishDate: new Date("1925-04-10"),
    genre: "Fiction",
    description: "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted 'gin was the national drink and sex the national obsession.'",
    price: 12.99,
    pages: 180,
    language: "English",
    rating: 4.5,
    stock: 25,
    isAvailable: true
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0446310789",
    publisher: "Grand Central Publishing",
    publishDate: new Date("1960-07-11"),
    genre: "Fiction",
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, addressing issues of race, inequality and segregation.",
    price: 14.99,
    pages: 281,
    language: "English",
    rating: 4.8,
    stock: 30,
    isAvailable: true
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "978-0451524935",
    publisher: "Signet",
    publishDate: new Date("1949-06-08"),
    genre: "Science Fiction",
    description: "A dystopian novel about totalitarianism and surveillance society, following the life of Winston Smith, a low-ranking member of 'the Party'.",
    price: 9.99,
    pages: 328,
    language: "English",
    rating: 4.6,
    stock: 20,
    isAvailable: true
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "978-0141439518",
    publisher: "Penguin Classics",
    publishDate: new Date("1813-01-28"),
    genre: "Romance",
    description: "The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of the British Regency.",
    price: 8.99,
    pages: 432,
    language: "English",
    rating: 4.7,
    stock: 15,
    isAvailable: true
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "978-0547928241",
    publisher: "Houghton Mifflin Harcourt",
    publishDate: new Date("1937-09-21"),
    genre: "Fantasy",
    description: "A fantasy novel about the adventures of Bilbo Baggins, a hobbit who embarks on a quest to reclaim the Lonely Mountain from the dragon Smaug.",
    price: 16.99,
    pages: 366,
    language: "English",
    rating: 4.9,
    stock: 40,
    isAvailable: true
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "978-0316769488",
    publisher: "Little, Brown and Company",
    publishDate: new Date("1951-07-16"),
    genre: "Fiction",
    description: "A novel about teenage alienation and loss of innocence in post-World War II America, narrated by Holden Caulfield.",
    price: 11.99,
    pages: 277,
    language: "English",
    rating: 4.3,
    stock: 18,
    isAvailable: true
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    isbn: "978-0399501487",
    publisher: "Penguin Books",
    publishDate: new Date("1954-09-17"),
    genre: "Fiction",
    description: "A novel about a group of British boys stranded on an uninhabited island and their disastrous attempt to govern themselves.",
    price: 10.99,
    pages: 224,
    language: "English",
    rating: 4.2,
    stock: 22,
    isAvailable: true
  },
  {
    title: "Animal Farm",
    author: "George Orwell",
    isbn: "978-0451526342",
    publisher: "Signet",
    publishDate: new Date("1945-08-17"),
    genre: "Fiction",
    description: "An allegorical novella about a group of farm animals who rebel against their human farmer, hoping to create a society where the animals can be equal, free, and happy.",
    price: 7.99,
    pages: 140,
    language: "English",
    rating: 4.4,
    stock: 35,
    isAvailable: true
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "978-0062315007",
    publisher: "HarperOne",
    publishDate: new Date("1988-01-01"),
    genre: "Fiction",
    description: "A novel about a young Andalusian shepherd who dreams of finding a worldly treasure and embarks on a journey to Egypt.",
    price: 13.99,
    pages: 208,
    language: "English",
    rating: 4.1,
    stock: 28,
    isAvailable: true
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    isbn: "978-0156013987",
    publisher: "Harcourt",
    publishDate: new Date("1943-04-06"),
    genre: "Fiction",
    description: "A poetic tale about a young prince who visits various planets in space, including Earth, and addresses themes of loneliness, friendship, love, and loss.",
    price: 9.99,
    pages: 96,
    language: "English",
    rating: 4.6,
    stock: 45,
    isAvailable: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Book.deleteMany({});
    console.log('Cleared existing books');

    // Insert sample books
    const insertedBooks = await Book.insertMany(sampleBooks);
    console.log(`Successfully inserted ${insertedBooks.length} books`);

    // Display the inserted books
    console.log('\nInserted books:');
    insertedBooks.forEach(book => {
      console.log(`- ${book.title} by ${book.author} ($${book.price})`);
    });

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 