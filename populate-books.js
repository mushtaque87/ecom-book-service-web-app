const axios = require('axios');

const API_URL = 'http://localhost:30080/books';

const books = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", publisher: "Scribner", publishDate: "1925-04-10", genre: "Fiction", description: "A story of the fabulously wealthy Jay Gatsby", price: 19.99, pages: 180 },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061120084", publisher: "J.B. Lippincott", publishDate: "1960-07-11", genre: "Fiction", description: "A gripping tale of racial injustice", price: 14.99, pages: 281 },
  { title: "1984", author: "George Orwell", isbn: "978-0451524935", publisher: "Secker & Warburg", publishDate: "1949-06-08", genre: "Dystopian", description: "A dystopian social science fiction novel", price: 13.99, pages: 328 },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", publisher: "T. Egerton", publishDate: "1813-01-28", genre: "Romance", description: "A romantic novel of manners", price: 12.99, pages: 432 },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769174", publisher: "Little, Brown", publishDate: "1951-07-16", genre: "Fiction", description: "A controversial novel about teenage rebellion", price: 15.99, pages: 277 },
  { title: "Lord of the Flies", author: "William Golding", isbn: "978-0571056866", publisher: "Faber & Faber", publishDate: "1954-09-17", genre: "Fiction", description: "A novel about British boys stranded on an island", price: 11.99, pages: 224 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", publisher: "George Allen & Unwin", publishDate: "1937-09-21", genre: "Fantasy", description: "A fantasy adventure novel", price: 16.99, pages: 310 },
  { title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "978-1451673319", publisher: "Ballantine Books", publishDate: "1953-10-19", genre: "Science Fiction", description: "A dystopian novel about book burning", price: 13.99, pages: 249 },
  { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "978-0141441146", publisher: "Smith, Elder & Co.", publishDate: "1847-10-16", genre: "Gothic Fiction", description: "A bildungsroman following the experiences of its eponymous heroine", price: 14.99, pages: 507 },
  { title: "Wuthering Heights", author: "Emily Brontë", isbn: "978-0141439556", publisher: "Thomas Cautley Newby", publishDate: "1847-12-01", genre: "Gothic Fiction", description: "A tale of passion and revenge", price: 13.99, pages: 416 },
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien", isbn: "978-0544003415", publisher: "George Allen & Unwin", publishDate: "1954-07-29", genre: "Fantasy", description: "An epic high fantasy novel", price: 29.99, pages: 1216 },
  { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", isbn: "978-0747532699", publisher: "Bloomsbury", publishDate: "1997-06-26", genre: "Fantasy", description: "The first novel in the Harry Potter series", price: 18.99, pages: 223 },
  { title: "The Da Vinci Code", author: "Dan Brown", isbn: "978-0307474278", publisher: "Doubleday", publishDate: "2003-03-18", genre: "Mystery", description: "A mystery thriller novel", price: 17.99, pages: 689 },
  { title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062315007", publisher: "HarperOne", publishDate: "1988-01-01", genre: "Adventure", description: "A philosophical book about following your dreams", price: 15.99, pages: 163 },
  { title: "The Kite Runner", author: "Khaled Hosseini", isbn: "978-1594631931", publisher: "Riverhead Books", publishDate: "2003-05-29", genre: "Historical Fiction", description: "A story of friendship and redemption", price: 16.99, pages: 371 },
  { title: "Life of Pi", author: "Yann Martel", isbn: "978-0156027328", publisher: "Knopf Canada", publishDate: "2001-09-11", genre: "Adventure", description: "A survival story of a boy and a tiger", price: 14.99, pages: 319 },
  { title: "The Book Thief", author: "Markus Zusak", isbn: "978-0375842207", publisher: "Picador", publishDate: "2005-09-01", genre: "Historical Fiction", description: "A story narrated by Death during WWII", price: 15.99, pages: 552 },
  { title: "Gone Girl", author: "Gillian Flynn", isbn: "978-0307588364", publisher: "Crown Publishing", publishDate: "2012-06-05", genre: "Thriller", description: "A psychological thriller about a missing wife", price: 16.99, pages: 419 },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "978-0307454546", publisher: "Norstedts Förlag", publishDate: "2005-08-01", genre: "Crime", description: "A crime thriller novel", price: 17.99, pages: 672 },
  { title: "The Hunger Games", author: "Suzanne Collins", isbn: "978-0439023528", publisher: "Scholastic Press", publishDate: "2008-09-14", genre: "Dystopian", description: "A dystopian novel about survival games", price: 13.99, pages: 374 },
  { title: "Twilight", author: "Stephenie Meyer", isbn: "978-0316015844", publisher: "Little, Brown", publishDate: "2005-10-05", genre: "Romance", description: "A vampire romance novel", price: 12.99, pages: 498 },
  { title: "The Fault in Our Stars", author: "John Green", isbn: "978-0525478812", publisher: "Dutton Books", publishDate: "2012-01-10", genre: "Young Adult", description: "A love story about two cancer patients", price: 14.99, pages: 313 },
  { title: "Fifty Shades of Grey", author: "E.L. James", isbn: "978-0345803481", publisher: "Vintage Books", publishDate: "2011-05-25", genre: "Romance", description: "An erotic romance novel", price: 15.99, pages: 514 },
  { title: "The Help", author: "Kathryn Stockett", isbn: "978-0425232200", publisher: "Amy Einhorn Books", publishDate: "2009-02-10", genre: "Historical Fiction", description: "A story about African American maids in 1960s Mississippi", price: 16.99, pages: 451 },
  { title: "Water for Elephants", author: "Sara Gruen", isbn: "978-1565125605", publisher: "Algonquin Books", publishDate: "2006-05-26", genre: "Historical Fiction", description: "A story set in a traveling circus during the Great Depression", price: 15.99, pages: 335 },
  { title: "The Time Traveler's Wife", author: "Audrey Niffenegger", isbn: "978-0156029438", publisher: "MacAdam/Cage", publishDate: "2003-09-01", genre: "Science Fiction", description: "A love story involving time travel", price: 16.99, pages: 518 },
  { title: "Memoirs of a Geisha", author: "Arthur Golden", isbn: "978-0679781585", publisher: "Knopf", publishDate: "1997-09-23", genre: "Historical Fiction", description: "A story about a geisha in Japan", price: 17.99, pages: 503 },
  { title: "The Lovely Bones", author: "Alice Sebold", isbn: "978-0316666343", publisher: "Little, Brown", publishDate: "2002-06-12", genre: "Fiction", description: "A story told from the perspective of a murdered girl", price: 15.99, pages: 328 },
  { title: "Eat, Pray, Love", author: "Elizabeth Gilbert", isbn: "978-0143038412", publisher: "Viking", publishDate: "2006-02-16", genre: "Memoir", description: "A memoir about self-discovery", price: 16.99, pages: 349 },
  { title: "The Secret Life of Bees", author: "Sue Monk Kidd", isbn: "978-0142001745", publisher: "Viking", publishDate: "2002-01-01", genre: "Fiction", description: "A coming-of-age story set in South Carolina", price: 14.99, pages: 301 },
  { title: "Angels & Demons", author: "Dan Brown", isbn: "978-0671027360", publisher: "Pocket Books", publishDate: "2000-05-01", genre: "Thriller", description: "A mystery thriller involving the Illuminati", price: 17.99, pages: 736 },
  { title: "The Curious Incident of the Dog in the Night-Time", author: "Mark Haddon", isbn: "978-1400032716", publisher: "Jonathan Cape", publishDate: "2003-05-01", genre: "Mystery", description: "A mystery novel narrated by an autistic teenager", price: 14.99, pages: 221 },
  { title: "Life After Life", author: "Kate Atkinson", isbn: "978-0316176484", publisher: "Little, Brown", publishDate: "2013-04-02", genre: "Historical Fiction", description: "A novel about multiple lives and possibilities", price: 16.99, pages: 529 },
  { title: "The Goldfinch", author: "Donna Tartt", isbn: "978-0316055437", publisher: "Little, Brown", publishDate: "2013-10-22", genre: "Fiction", description: "A coming-of-age story centered around a painting", price: 18.99, pages: 771 },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", isbn: "978-1476746586", publisher: "Scribner", publishDate: "2014-05-06", genre: "Historical Fiction", description: "A WWII story about a blind French girl and German boy", price: 17.99, pages: 531 },
  { title: "The Martian", author: "Andy Weir", isbn: "978-0553418026", publisher: "Crown", publishDate: "2011-09-27", genre: "Science Fiction", description: "A survival story about an astronaut stranded on Mars", price: 15.99, pages: 369 },
  { title: "Big Little Lies", author: "Liane Moriarty", isbn: "978-0399167065", publisher: "Amy Einhorn Books", publishDate: "2014-07-29", genre: "Mystery", description: "A mystery about three women and a school trivia night", price: 16.99, pages: 460 },
  { title: "The Girl on the Train", author: "Paula Hawkins", isbn: "978-1594633669", publisher: "Riverhead Books", publishDate: "2015-01-13", genre: "Thriller", description: "A psychological thriller about an unreliable narrator", price: 15.99, pages: 325 },
  { title: "Where the Crawdads Sing", author: "Delia Owens", isbn: "978-0735219090", publisher: "G.P. Putnam's Sons", publishDate: "2018-08-14", genre: "Mystery", description: "A mystery about a girl who grew up isolated in the marshes", price: 17.99, pages: 370 },
  { title: "Educated", author: "Tara Westover", isbn: "978-0399590504", publisher: "Random House", publishDate: "2018-02-20", genre: "Memoir", description: "A memoir about education and family", price: 16.99, pages: 334 },
  { title: "Becoming", author: "Michelle Obama", isbn: "978-1524763138", publisher: "Crown", publishDate: "2018-11-13", genre: "Memoir", description: "A memoir by the former First Lady", price: 19.99, pages: 448 },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn: "978-1501139239", publisher: "Atria Books", publishDate: "2017-06-13", genre: "Fiction", description: "A story about a reclusive Hollywood icon", price: 16.99, pages: 400 },
  { title: "Circe", author: "Madeline Miller", isbn: "978-0316556347", publisher: "Little, Brown", publishDate: "2018-04-10", genre: "Fantasy", description: "A retelling of Greek mythology from Circe's perspective", price: 17.99, pages: 393 },
  { title: "The Silent Patient", author: "Alex Michaelides", isbn: "978-1250301697", publisher: "Celadon Books", publishDate: "2019-02-05", genre: "Thriller", description: "A psychological thriller about a woman who refuses to speak", price: 16.99, pages: 336 },
  { title: "Normal People", author: "Sally Rooney", isbn: "978-0571334650", publisher: "Faber & Faber", publishDate: "2018-08-28", genre: "Fiction", description: "A story about the relationship between two Irish teenagers", price: 15.99, pages: 266 },
  { title: "The Midnight Library", author: "Matt Haig", isbn: "978-0525559474", publisher: "Viking", publishDate: "2020-08-13", genre: "Fiction", description: "A novel about life's infinite possibilities", price: 16.99, pages: 288 },
  { title: "Project Hail Mary", author: "Andy Weir", isbn: "978-0593135204", publisher: "Ballantine Books", publishDate: "2021-05-04", genre: "Science Fiction", description: "A space survival story with humor and heart", price: 17.99, pages: 496 },
  { title: "The Thursday Murder Club", author: "Richard Osman", isbn: "978-1984880987", publisher: "Pamela Dorman Books", publishDate: "2020-09-03", genre: "Mystery", description: "A cozy mystery about retirees solving cold cases", price: 15.99, pages: 368 },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", isbn: "978-0593318171", publisher: "Knopf", publishDate: "2021-03-02", genre: "Science Fiction", description: "A story told from the perspective of an artificial friend", price: 16.99, pages: 303 },
  { title: "The Vanishing Half", author: "Brit Bennett", isbn: "978-0525536291", publisher: "Riverhead Books", publishDate: "2020-06-02", genre: "Fiction", description: "A story about twin sisters who choose different racial identities", price: 17.99, pages: 343 },
  { title: "Hamnet", author: "Maggie O'Farrell", isbn: "978-0525657606", publisher: "Knopf", publishDate: "2020-07-07", genre: "Historical Fiction", description: "A fictional account of the death of Shakespeare's son", price: 16.99, pages: 305 }
];

// Generate 50 more books to reach 100
const genres = ["Fiction", "Mystery", "Romance", "Science Fiction", "Fantasy", "Thriller", "Historical Fiction", "Biography", "Self-Help", "Business"];
const authors = ["John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", "David Wilson", "Lisa Anderson", "Robert Taylor", "Jennifer Martinez", "William Garcia", "Mary Rodriguez"];
const publishers = ["Random House", "Penguin", "HarperCollins", "Simon & Schuster", "Macmillan", "Hachette", "Scholastic", "Wiley", "Oxford", "Cambridge"];

for (let i = 51; i <= 100; i++) {
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
  const randomPublisher = publishers[Math.floor(Math.random() * publishers.length)];
  
  books.push({
    title: `Book Title ${i}`,
    author: randomAuthor,
    isbn: `978-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    publisher: randomPublisher,
    publishDate: `${1990 + Math.floor(Math.random() * 34)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    genre: randomGenre,
    description: `A compelling ${randomGenre.toLowerCase()} book that will captivate readers`,
    price: Math.floor(Math.random() * 30) + 10,
    pages: Math.floor(Math.random() * 500) + 200
  });
}

async function populateBooks() {
  console.log('🚀 Starting to populate 100 books...');
  
  for (let i = 0; i < books.length; i++) {
    try {
      const response = await axios.post(API_URL, books[i]);
      console.log(`✅ Book ${i + 1}/100: "${books[i].title}" created`);
    } catch (error) {
      console.log(`❌ Failed to create book ${i + 1}: ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log('🎉 Finished populating books!');
}

populateBooks();