// Edit this file to update your menu!
// Categories and items will automatically appear on the menu

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tags?: ('vegetarian' | 'vegan' | 'gluten-free' | 'spicy' | 'popular')[];
  image?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
}

export const restaurantInfo: RestaurantInfo = {
  name: "The Cozy Kitchen",
  tagline: "Fresh • Local • Delicious",
  currency: "INR",
  currencySymbol: "₹",
};

export const menuData: MenuCategory[] = [
  {
    id: "starters",
    name: "Starters",
    icon: "🥗",
    items: [
      {
        id: "s1",
        name: "Garden Fresh Salad",
        description: "Mixed greens, cherry tomatoes, cucumber, and house vinaigrette",
        price: 180,
        tags: ["vegetarian", "vegan", "gluten-free"],
      },
      {
        id: "s2",
        name: "Crispy Paneer Bites",
        description: "Golden fried paneer cubes with mint chutney",
        price: 220,
        tags: ["vegetarian", "popular"],
      },
      {
        id: "s3",
        name: "Soup of the Day",
        description: "Chef's special soup, ask your server for today's selection",
        price: 150,
        tags: ["vegetarian"],
      },
    ],
  },
  {
    id: "mains",
    name: "Main Course",
    icon: "🍛",
    items: [
      {
        id: "m1",
        name: "Butter Chicken",
        description: "Tender chicken in creamy tomato gravy, served with naan",
        price: 350,
        tags: ["popular"],
      },
      {
        id: "m2",
        name: "Paneer Tikka Masala",
        description: "Grilled paneer in rich spiced gravy with rice",
        price: 280,
        tags: ["vegetarian", "popular"],
      },
      {
        id: "m3",
        name: "Dal Makhani",
        description: "Slow-cooked black lentils in buttery tomato sauce",
        price: 220,
        tags: ["vegetarian", "gluten-free"],
      },
      {
        id: "m4",
        name: "Spicy Veggie Biryani",
        description: "Fragrant basmati rice with seasonal vegetables",
        price: 260,
        tags: ["vegetarian", "spicy"],
      },
    ],
  },
  {
    id: "beverages",
    name: "Beverages",
    icon: "☕",
    items: [
      {
        id: "b1",
        name: "Masala Chai",
        description: "Traditional spiced tea with milk",
        price: 60,
        tags: ["vegetarian"],
      },
      {
        id: "b2",
        name: "Fresh Lime Soda",
        description: "Sweet or salted, refreshingly cool",
        price: 80,
        tags: ["vegan", "gluten-free"],
      },
      {
        id: "b3",
        name: "Mango Lassi",
        description: "Creamy yogurt smoothie with alphonso mango",
        price: 120,
        tags: ["vegetarian", "popular"],
      },
      {
        id: "b4",
        name: "Cold Coffee",
        description: "Chilled coffee with ice cream",
        price: 140,
        tags: ["vegetarian"],
      },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    icon: "🍰",
    items: [
      {
        id: "d1",
        name: "Gulab Jamun",
        description: "Soft milk dumplings in rose-scented syrup (2 pcs)",
        price: 100,
        tags: ["vegetarian"],
      },
      {
        id: "d2",
        name: "Chocolate Brownie",
        description: "Warm brownie with vanilla ice cream",
        price: 180,
        tags: ["vegetarian", "popular"],
      },
      {
        id: "d3",
        name: "Kulfi",
        description: "Traditional Indian ice cream, choice of flavors",
        price: 90,
        tags: ["vegetarian", "gluten-free"],
      },
    ],
  },
];
