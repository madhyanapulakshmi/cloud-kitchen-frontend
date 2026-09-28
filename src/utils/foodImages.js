const foodImages = {
  "Chicken Biryani": "/images/chicken-biryani.jpg",
  "Paneer Biryani": "/images/paneer-biryani.jpg",
  "Chicken Burger": "/images/chicken-burger.jpg",
  "Veg Fried Rice": "/images/veg-fried-rice.jpg",
};

export function getFoodImage(food) {
  return foodImages[food.name] || "/images/food-placeholder.jpg";
}

