// Catalogue text data. Photos live in product-photos.js and are merged in by seed.js.
export const products = [
  // Electronics
  { name: 'Aurora Wireless Headphones', brand: 'Sonara', category: 'Electronics', price: 2999, stock: 40, featured: true, description: 'Over-ear Bluetooth 5.3 headphones with active noise cancellation, 40-hour battery life and plush memory-foam ear cushions for all-day comfort.' },
  { name: 'Pulse Smartwatch Series 5', brand: 'Zenith', category: 'Electronics', price: 4499, stock: 25, featured: true, description: 'AMOLED display smartwatch with heart-rate and SpO2 monitoring, GPS, 100+ sport modes and a 7-day battery.' },
  { name: 'Nimbus 20,000mAh Power Bank', brand: 'Voltix', category: 'Electronics', price: 1799, stock: 60, description: '65W fast-charging power bank with two USB-C ports and one USB-A. Charges a laptop, phone and earbuds at once.' },
  { name: 'Vertex Mechanical Keyboard', brand: 'KeyForge', category: 'Electronics', price: 3499, stock: 18, featured: true, description: 'Hot-swappable 75% mechanical keyboard with tactile switches, PBT keycaps and per-key RGB lighting.' },
  { name: 'Orbit Portable Bluetooth Speaker', brand: 'Sonara', category: 'Electronics', price: 2199, stock: 35, description: 'Waterproof (IP67) 360° speaker with deep bass and 12 hours of playtime. Pair two for stereo sound.' },
  { name: 'Lumen 1080p Webcam', brand: 'Zenith', category: 'Electronics', price: 1499, stock: 4, description: 'Full HD webcam with auto-focus, dual noise-reducing microphones and a privacy shutter.' },

  // Fashion
  { name: 'Classic Denim Jacket', brand: 'Urban Thread', category: 'Fashion', price: 2499, stock: 30, featured: true, description: 'Timeless mid-wash denim jacket in a regular fit. Durable cotton with a soft inner finish.' },
  { name: 'Everyday Cotton T-Shirt (Pack of 3)', brand: 'Urban Thread', category: 'Fashion', price: 799, stock: 120, description: 'Breathable 100% combed-cotton crew-neck tees. Pre-shrunk, tag-free and made to last wash after wash.' },
  { name: 'Trailrunner Sneakers', brand: 'Stride', category: 'Fashion', price: 3299, stock: 45, description: 'Lightweight mesh sneakers with a cushioned midsole and grippy outsole, built for the city and the trail.' },
  { name: 'Leather Bifold Wallet', brand: 'Tanner & Co', category: 'Fashion', price: 999, stock: 70, description: 'Full-grain leather wallet with RFID protection, 6 card slots and a coin pocket.' },
  { name: 'Aviator Polarized Sunglasses', brand: 'Ray Haven', category: 'Fashion', price: 1299, stock: 55, description: 'UV400 polarized lenses in a lightweight metal frame. Includes hard case and microfibre cloth.' },

  // Home & Kitchen
  { name: 'Ember Electric Kettle 1.8L', brand: 'HomeNest', category: 'Home & Kitchen', price: 1199, stock: 50, description: 'Stainless-steel electric kettle with auto shut-off, boil-dry protection and a 360° swivel base.' },
  { name: 'Barista Pour-Over Coffee Set', brand: 'HomeNest', category: 'Home & Kitchen', price: 1899, stock: 22, featured: true, description: 'Borosilicate glass carafe with a reusable stainless-steel filter. Brings out clean, bright flavours.' },
  { name: 'CloudSoft Memory Foam Pillow', brand: 'Slumber', category: 'Home & Kitchen', price: 1499, stock: 65, description: 'Contoured cervical pillow with a cooling gel layer and a washable bamboo-fibre cover.' },
  { name: 'Terra Non-Stick Cookware Set (5 pc)', brand: 'HomeNest', category: 'Home & Kitchen', price: 3999, stock: 15, description: 'Induction-ready granite non-stick set: frying pan, saucepan, kadhai and two lids. PFOA free.' },
  { name: 'Fern Ceramic Planter (Set of 2)', brand: 'Greenery', category: 'Home & Kitchen', price: 649, stock: 0, description: 'Hand-finished ceramic planters with bamboo trays and drainage holes. Out of stock until the next batch.' },

  // Books
  { name: 'Clean Code', brand: 'Prentice Hall', category: 'Books', price: 799, stock: 80, featured: true, description: 'A handbook of agile software craftsmanship by Robert C. Martin. Learn to write code that is readable, maintainable and professional.' },
  { name: 'Atomic Habits', brand: 'Penguin', category: 'Books', price: 499, stock: 150, description: 'James Clear’s practical guide to building good habits and breaking bad ones through tiny daily changes.' },
  { name: 'The Pragmatic Programmer', brand: 'Addison-Wesley', category: 'Books', price: 899, stock: 40, description: 'Your journey to mastery: timeless tips on tools, craft and career for software developers.' },
  { name: 'Designing Data-Intensive Applications', brand: 'O’Reilly', category: 'Books', price: 1299, stock: 28, description: 'Martin Kleppmann explains the principles behind reliable, scalable and maintainable data systems.' },

  // Sports & Fitness
  { name: 'FlexGrip Yoga Mat 6mm', brand: 'Stride', category: 'Sports & Fitness', price: 899, stock: 90, description: 'Non-slip, extra-thick TPE yoga mat with alignment lines and a carry strap.' },
  { name: 'IronCore Adjustable Dumbbells (2 x 10kg)', brand: 'IronCore', category: 'Sports & Fitness', price: 2799, stock: 20, description: 'Adjustable dumbbell pair with quick-lock plates, 2kg to 10kg each. Ideal for home workouts.' },
  { name: 'Swift Skipping Rope', brand: 'Stride', category: 'Sports & Fitness', price: 299, stock: 200, description: 'Tangle-free speed rope with ball-bearing handles and an adjustable steel cable.' },
  { name: 'HydroMax Insulated Bottle 1L', brand: 'HydroMax', category: 'Sports & Fitness', price: 749, stock: 100, description: 'Double-wall vacuum bottle that keeps drinks cold for 24 hours or hot for 12.' },
];
