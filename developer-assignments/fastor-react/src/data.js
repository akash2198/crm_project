export const products = [
  {
    id: "pizza",
    name: "Classic Margherita",
    category: "Pizza",
    price: 14,
    image: "/assets/pizza.jpg",
    description:
      "A golden, stone-baked crust with rich tomato sauce, creamy mozzarella and fresh basil. Simple ingredients. Big flavour.",
    tag: "Bestseller",
    time: "20–25 min",
    rating: "4.9",
  },
  {
    id: "burger",
    name: "Chicken Burger",
    category: "Burgers",
    price: 20,
    image: "/assets/burger.jpg",
    description:
      "Crispy chicken, fresh lettuce and our signature sauce, tucked into a toasted sesame bun.",
    tag: "Popular",
    time: "15–20 min",
    rating: "4.8",
  },
  {
    id: "shake",
    name: "Strawberry Shake",
    category: "Drinks",
    price: 20,
    image: "/assets/shake.jpg",
    description:
      "Sweet strawberries blended with chilled milk and vanilla ice cream. Finished with a generous swirl of cream.",
    tag: "Freshly made",
    time: "10–15 min",
    rating: "4.7",
  },
  {
    id: "salad",
    name: "Garden Bowl",
    category: "Bowls",
    price: 12.99,
    image: "/assets/salad.jpg",
    description:
      "A colourful bowl of crunchy greens, seasonal vegetables and a bright, zesty dressing.",
    tag: "Feel good food",
    time: "15–20 min",
    rating: "4.8",
  },
];
export const portions = [
  { label: "Personal (4 Slices)", extra: 0 },
  { label: "Medium (8 Slices)", extra: 3 },
  { label: "Familiar (10 Slices)", extra: 6 },
  { label: "Jumbo (12 Slices)", extra: 9 },
];
export const money = (value) => `₹${value.toFixed(2)}`;
