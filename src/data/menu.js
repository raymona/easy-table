// Menu organized by daypart > category > items
// needsModScreen: false = quick add (drinks, simple sides)
// needsModScreen: true = opens mod screen (proteins, customizable items)

export const MENU = {
  lunch: {
    drinks: {
      label: 'Drinks',
      items: [
        { id: 'coffee', name: 'Coffee', price: 3.50, needsModScreen: false },
        { id: 'tea', name: 'Tea', price: 3.00, needsModScreen: false },
        { id: 'juice-orange', name: 'Fresh OJ', price: 5.00, needsModScreen: false },
        { id: 'juice-apple', name: 'Apple Juice', price: 4.00, needsModScreen: false },
        { id: 'soda-coke', name: 'Coke', price: 3.50, needsModScreen: false },
        { id: 'soda-sprite', name: 'Sprite', price: 3.50, needsModScreen: false },
        { id: 'soda-ginger', name: 'Ginger Ale', price: 3.50, needsModScreen: false },
        { id: 'water-sparkling', name: 'Sparkling Water', price: 4.00, needsModScreen: false },
        { id: 'iced-tea', name: 'Iced Tea', price: 4.00, needsModScreen: false },
        { id: 'lemonade', name: 'Lemonade', price: 4.50, needsModScreen: false },
        { id: 'beer-lager', name: 'House Lager', price: 7.00, needsModScreen: false },
        { id: 'beer-ipa', name: 'Local IPA', price: 8.00, needsModScreen: false },
        { id: 'beer-stout', name: 'Irish Stout', price: 8.00, needsModScreen: false },
        { id: 'wine-house-w', name: 'House White (glass)', price: 10.00, needsModScreen: false },
        { id: 'wine-house-r', name: 'House Red (glass)', price: 10.00, needsModScreen: false },
      ]
    },
    apps: {
      label: 'Starters',
      items: [
        { id: 'soup', name: 'Soup of the Day', price: 8.00, needsModScreen: true },
        { id: 'wings', name: 'Crispy Wings', price: 16.00, needsModScreen: true, addOns: ['Extra Sauce', 'Blue Cheese', 'Celery'] },
        { id: 'nachos', name: 'Loaded Nachos', price: 18.00, needsModScreen: true, addOns: ['Guac', 'Sour Cream', 'Jalapeños'] },
        { id: 'calamari', name: 'Fried Calamari', price: 16.00, needsModScreen: true },
        { id: 'bruschetta', name: 'Bruschetta', price: 12.00, needsModScreen: true },
        { id: 'spinach-dip', name: 'Spinach Artichoke Dip', price: 14.00, needsModScreen: true },
        { id: 'sliders', name: 'Beef Sliders (3)', price: 15.00, needsModScreen: true, hasCookTemp: true },
      ]
    },
    sandwiches: {
      label: 'Sandwiches & Burgers',
      items: [
        { id: 'club', name: 'Classic Club', price: 17.00, needsModScreen: true },
        { id: 'blt', name: 'BLT', price: 14.00, needsModScreen: true },
        { id: 'grilled-cheese', name: 'Grilled Cheese', price: 12.00, needsModScreen: true, addOns: ['Bacon', 'Tomato', 'Avocado'] },
        { id: 'chicken-sand', name: 'Crispy Chicken Sandwich', price: 18.00, needsModScreen: true },
        { id: 'reuben', name: 'Reuben', price: 19.00, needsModScreen: true },
        { id: 'burger-classic', name: 'Classic Burger', price: 18.00, needsModScreen: true, hasCookTemp: true, addOns: ['Bacon', 'Cheese', 'Fried Egg', 'Avocado'] },
        { id: 'burger-mushroom', name: 'Mushroom Swiss Burger', price: 20.00, needsModScreen: true, hasCookTemp: true },
        { id: 'burger-veggie', name: 'Veggie Burger', price: 17.00, needsModScreen: true },
      ]
    },
    pizzas: {
      label: 'Pizzas & Flatbreads',
      items: [
        { id: 'pizza-marg', name: 'Margherita', price: 16.00, needsModScreen: true },
        { id: 'pizza-pepperoni', name: 'Pepperoni', price: 18.00, needsModScreen: true },
        { id: 'pizza-meat', name: 'Meat Lovers', price: 22.00, needsModScreen: true },
        { id: 'pizza-veggie', name: 'Garden Veggie', price: 18.00, needsModScreen: true },
        { id: 'flatbread-fig', name: 'Fig & Prosciutto Flatbread', price: 16.00, needsModScreen: true },
        { id: 'flatbread-mush', name: 'Wild Mushroom Flatbread', price: 15.00, needsModScreen: true },
      ]
    },
    mains: {
      label: 'Mains',
      items: [
        { id: 'fish-chips', name: 'Fish & Chips', price: 22.00, needsModScreen: true },
        { id: 'fish-tacos', name: 'Fish Tacos', price: 19.00, needsModScreen: true },
        { id: 'chicken-caesar', name: 'Chicken Caesar Salad', price: 18.00, needsModScreen: true },
        { id: 'cobb', name: 'Cobb Salad', price: 19.00, needsModScreen: true },
        { id: 'pasta-primavera', name: 'Pasta Primavera', price: 18.00, needsModScreen: true },
        { id: 'mac-cheese', name: 'Truffle Mac & Cheese', price: 17.00, needsModScreen: true, addOns: ['Bacon', 'Lobster', 'Pulled Pork'] },
      ]
    },
    sides: {
      label: 'Sides',
      items: [
        { id: 'fries', name: 'Fries', price: 6.00, needsModScreen: false },
        { id: 'sweet-fries', name: 'Sweet Potato Fries', price: 7.00, needsModScreen: false },
        { id: 'onion-rings', name: 'Onion Rings', price: 8.00, needsModScreen: false },
        { id: 'coleslaw', name: 'Coleslaw', price: 4.00, needsModScreen: false },
        { id: 'side-salad', name: 'Side Salad', price: 6.00, needsModScreen: false },
        { id: 'garlic-bread', name: 'Garlic Bread', price: 5.00, needsModScreen: false },
      ]
    },
    dessert: {
      label: 'Dessert',
      items: [
        { id: 'brownie', name: 'Warm Brownie Sundae', price: 10.00, needsModScreen: true },
        { id: 'cheesecake', name: 'NY Cheesecake', price: 10.00, needsModScreen: true },
        { id: 'sticky-toffee', name: 'Sticky Toffee Pudding', price: 11.00, needsModScreen: true },
      ]
    }
  },
  dinner: {
    drinks: {
      label: 'Drinks',
      items: [
        { id: 'coffee', name: 'Coffee', price: 3.50, needsModScreen: false },
        { id: 'tea', name: 'Tea', price: 3.00, needsModScreen: false },
        { id: 'soda-coke', name: 'Coke', price: 3.50, needsModScreen: false },
        { id: 'soda-sprite', name: 'Sprite', price: 3.50, needsModScreen: false },
        { id: 'soda-ginger', name: 'Ginger Ale', price: 3.50, needsModScreen: false },
        { id: 'water-sparkling', name: 'Sparkling Water', price: 4.00, needsModScreen: false },
        { id: 'beer-lager', name: 'House Lager', price: 7.00, needsModScreen: false },
        { id: 'beer-ipa', name: 'Local IPA', price: 8.00, needsModScreen: false },
        { id: 'beer-stout', name: 'Irish Stout', price: 8.00, needsModScreen: false },
        { id: 'beer-pilsner', name: 'Czech Pilsner', price: 8.00, needsModScreen: false },
        { id: 'wine-house-w', name: 'House White (glass)', price: 12.00, needsModScreen: false },
        { id: 'wine-house-r', name: 'House Red (glass)', price: 12.00, needsModScreen: false },
        { id: 'wine-sauv', name: 'Sauvignon Blanc', price: 14.00, needsModScreen: false },
        { id: 'wine-chard', name: 'Chardonnay', price: 14.00, needsModScreen: false },
        { id: 'wine-pinot', name: 'Pinot Noir', price: 15.00, needsModScreen: false },
        { id: 'wine-cab', name: 'Cabernet Sauvignon', price: 16.00, needsModScreen: false },
        { id: 'cocktail-marg', name: 'House Margarita', price: 14.00, needsModScreen: false },
        { id: 'cocktail-old-f', name: 'Old Fashioned', price: 15.00, needsModScreen: false },
        { id: 'cocktail-mojito', name: 'Mojito', price: 14.00, needsModScreen: false },
        { id: 'cocktail-mule', name: 'Moscow Mule', price: 14.00, needsModScreen: false },
        { id: 'cocktail-negroni', name: 'Negroni', price: 15.00, needsModScreen: false },
        { id: 'cocktail-martini', name: 'Martini', price: 16.00, needsModScreen: false },
      ]
    },
    apps: {
      label: 'Starters',
      items: [
        { id: 'soup', name: 'Soup of the Day', price: 10.00, needsModScreen: true },
        { id: 'wings', name: 'Crispy Wings', price: 18.00, needsModScreen: true, addOns: ['Extra Sauce', 'Blue Cheese', 'Celery'] },
        { id: 'nachos', name: 'Loaded Nachos', price: 20.00, needsModScreen: true, addOns: ['Guac', 'Sour Cream', 'Jalapeños'] },
        { id: 'calamari', name: 'Fried Calamari', price: 18.00, needsModScreen: true },
        { id: 'bruschetta', name: 'Bruschetta', price: 14.00, needsModScreen: true },
        { id: 'beef-tartare', name: 'Beef Tartare', price: 19.00, needsModScreen: true },
        { id: 'tuna-tartare', name: 'Tuna Tartare', price: 21.00, needsModScreen: true },
        { id: 'oysters', name: 'Oysters (6)', price: 24.00, needsModScreen: true },
        { id: 'shrimp-cocktail', name: 'Shrimp Cocktail', price: 22.00, needsModScreen: true },
        { id: 'charcuterie', name: 'Charcuterie Board', price: 26.00, needsModScreen: true },
      ]
    },
    sandwiches: {
      label: 'Burgers',
      items: [
        { id: 'burger-classic', name: 'Classic Burger', price: 20.00, needsModScreen: true, hasCookTemp: true, addOns: ['Bacon', 'Cheese', 'Fried Egg', 'Avocado'] },
        { id: 'burger-mushroom', name: 'Mushroom Swiss Burger', price: 22.00, needsModScreen: true, hasCookTemp: true },
        { id: 'burger-blue', name: 'Blue Cheese Burger', price: 23.00, needsModScreen: true, hasCookTemp: true },
        { id: 'burger-veggie', name: 'Veggie Burger', price: 19.00, needsModScreen: true },
      ]
    },
    pizzas: {
      label: 'Pizzas & Flatbreads',
      items: [
        { id: 'pizza-marg', name: 'Margherita', price: 18.00, needsModScreen: true },
        { id: 'pizza-pepperoni', name: 'Pepperoni', price: 20.00, needsModScreen: true },
        { id: 'pizza-meat', name: 'Meat Lovers', price: 24.00, needsModScreen: true },
        { id: 'pizza-truffle', name: 'Truffle & Mushroom', price: 24.00, needsModScreen: true },
        { id: 'flatbread-fig', name: 'Fig & Prosciutto Flatbread', price: 18.00, needsModScreen: true },
      ]
    },
    mains: {
      label: 'Mains',
      items: [
        { id: 'fish-chips', name: 'Fish & Chips', price: 26.00, needsModScreen: true },
        { id: 'salmon', name: 'Pan-Seared Salmon', price: 32.00, needsModScreen: true },
        { id: 'chicken', name: 'Roast Chicken', price: 28.00, needsModScreen: true },
        { id: 'pork-chop', name: 'Grilled Pork Chop', price: 30.00, needsModScreen: true, hasCookTemp: true },
        { id: 'lamb-chops', name: 'Lamb Chops', price: 38.00, needsModScreen: true, hasCookTemp: true },
        { id: 'steak-ribeye', name: 'Ribeye 14oz', price: 52.00, needsModScreen: true, hasCookTemp: true, addOns: ['Peppercorn Sauce', 'Blue Cheese Butter', 'Garlic Butter', 'Mushrooms'] },
        { id: 'steak-filet', name: 'Filet Mignon 8oz', price: 48.00, needsModScreen: true, hasCookTemp: true, addOns: ['Peppercorn Sauce', 'Blue Cheese Butter', 'Garlic Butter'] },
        { id: 'steak-strip', name: 'NY Strip 12oz', price: 46.00, needsModScreen: true, hasCookTemp: true },
        { id: 'short-rib', name: 'Braised Short Rib', price: 36.00, needsModScreen: true },
        { id: 'pasta-bolognese', name: 'Bolognese', price: 24.00, needsModScreen: true },
        { id: 'pasta-carbonara', name: 'Carbonara', price: 24.00, needsModScreen: true },
        { id: 'risotto', name: 'Mushroom Risotto', price: 26.00, needsModScreen: true },
      ]
    },
    sides: {
      label: 'Sides',
      items: [
        { id: 'fries', name: 'Fries', price: 7.00, needsModScreen: false },
        { id: 'truffle-fries', name: 'Truffle Fries', price: 10.00, needsModScreen: false },
        { id: 'mashed', name: 'Mashed Potatoes', price: 8.00, needsModScreen: false },
        { id: 'baked-potato', name: 'Loaded Baked Potato', price: 9.00, needsModScreen: false },
        { id: 'asparagus', name: 'Grilled Asparagus', price: 10.00, needsModScreen: false },
        { id: 'brussels', name: 'Roasted Brussels Sprouts', price: 10.00, needsModScreen: false },
        { id: 'creamed-spinach', name: 'Creamed Spinach', price: 9.00, needsModScreen: false },
        { id: 'caesar-side', name: 'Side Caesar', price: 8.00, needsModScreen: false },
      ]
    },
    dessert: {
      label: 'Dessert',
      items: [
        { id: 'brownie', name: 'Warm Brownie Sundae', price: 12.00, needsModScreen: true },
        { id: 'cheesecake', name: 'NY Cheesecake', price: 12.00, needsModScreen: true },
        { id: 'sticky-toffee', name: 'Sticky Toffee Pudding', price: 13.00, needsModScreen: true },
        { id: 'creme-brulee', name: 'Crème Brûlée', price: 12.00, needsModScreen: true },
        { id: 'affogato', name: 'Affogato', price: 10.00, needsModScreen: true },
      ]
    }
  }
};

export const COOK_TEMPS = ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done'];

export const COURSES = ['', 'Drinks', 'Apps', 'Mains', 'Dessert'];

export const VOID_REASONS = [
  'Guest changed mind',
  'Kitchen error',
  'Server error',
  '86\'d',
  'Comp',
  'Other'
];

export const DISCOUNT_PRESETS = [
  { label: '10%', type: 'percent', value: 10 },
  { label: '20%', type: 'percent', value: 20 },
  { label: '50% Industry', type: 'percent', value: 50 },
  { label: '100% Comp', type: 'percent', value: 100 },
  { label: '$5 off', type: 'fixed', value: 5 },
  { label: '$10 off', type: 'fixed', value: 10 },
  { label: '$20 off', type: 'fixed', value: 20 },
];

export const CARD_TYPES = ['Visa', 'Mastercard', 'Amex', 'Discover'];

export const TIP_PRESETS = [15, 18, 20, 25];

// Server data
export const SERVERS = [
  { id: 1, name: 'Ray', color: '#3B82F6' },
  { id: 2, name: 'Nik', color: '#10B981' },
  { id: 3, name: 'Hannah', color: '#F59E0B' },
  { id: 4, name: 'Yaro', color: '#8B5CF6' },
  { id: 5, name: 'Ashley', color: '#EC4899' },
];

// Floor sections
export const FLOOR_SECTIONS = ['dining', 'lounge', 'patio'];

export const FLOOR_SECTION_LABELS = {
  dining: 'Dining Room',
  lounge: 'Lounge / Bar',
  patio: 'Patio',
};

// Table layout - organized by section
export const TABLES = [
  // Dining Room
  { id: 1, x: 40, y: 30, shape: 'square', defaultSeats: 4, section: 'dining' },
  { id: 2, x: 140, y: 30, shape: 'square', defaultSeats: 4, section: 'dining' },
  { id: 3, x: 240, y: 30, shape: 'round', defaultSeats: 6, section: 'dining' },
  { id: 4, x: 40, y: 130, shape: 'rectangle', defaultSeats: 6, section: 'dining' },
  { id: 5, x: 180, y: 130, shape: 'booth', defaultSeats: 4, section: 'dining' },
  { id: 6, x: 40, y: 220, shape: 'square', defaultSeats: 2, section: 'dining' },
  { id: 7, x: 140, y: 220, shape: 'square', defaultSeats: 2, section: 'dining' },
  { id: 8, x: 240, y: 220, shape: 'round', defaultSeats: 8, section: 'dining' },
  // Lounge / Bar
  { id: 101, x: 40, y: 30, shape: 'round', defaultSeats: 2, section: 'lounge' },
  { id: 102, x: 120, y: 30, shape: 'round', defaultSeats: 2, section: 'lounge' },
  { id: 103, x: 200, y: 30, shape: 'round', defaultSeats: 4, section: 'lounge' },
  { id: 104, x: 40, y: 110, shape: 'square', defaultSeats: 4, section: 'lounge' },
  { id: 105, x: 140, y: 110, shape: 'booth', defaultSeats: 6, section: 'lounge' },
  { id: 106, x: 40, y: 200, shape: 'rectangle', defaultSeats: 8, section: 'lounge' },
  // Patio
  { id: 201, x: 40, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
  { id: 202, x: 140, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
  { id: 203, x: 240, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
  { id: 204, x: 40, y: 120, shape: 'round', defaultSeats: 6, section: 'patio' },
  { id: 205, x: 150, y: 120, shape: 'rectangle', defaultSeats: 8, section: 'patio' },
];

// Helper to get current menu based on time
export const getCurrentDaypart = () => {
  const hour = new Date().getHours();
  return hour < 17 ? 'lunch' : 'dinner';
};
