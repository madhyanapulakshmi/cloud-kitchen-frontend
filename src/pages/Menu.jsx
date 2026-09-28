import { useMemo, useState } from "react";
import "./Pages.css";

function Menu({ foods, cart, addToCart, removeFromCart }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const fallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

  const getImageUrl = (food) => {
    const value = String(food?.imageUrl || "").trim();
    if (!value) return fallbackImage;
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) return value;
    return `https://cloud-kitchen-backend-production.up.railway.app${value.startsWith("/") ? value : `/${value}`}`;
  };

  const filteredFoods = useMemo(() => foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "ALL" || food.category === category;
    return matchesSearch && matchesCategory;
  }), [foods, search, category]);

  const getQuantity = (foodId) => {
    const item = cart.find((item) => item.id === foodId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label">EXPLORE</span>
        <h1>Our Menu</h1>
        <p>Choose your favourite food and add it to your cart.</p>
      </div>

      <div className="menu-controls">
        <div className="menu-search"><span>🔍</span><input type="text" placeholder="Search food..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="menu-filters">
          <button className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}>All</button>
          <button className={category === "VEG" ? "active" : ""} onClick={() => setCategory("VEG")}>🟢 Veg</button>
          <button className={category === "NON_VEG" ? "active" : ""} onClick={() => setCategory("NON_VEG")}>🔴 Non-Veg</button>
        </div>
      </div>

      <div className="menu-food-grid">
        {filteredFoods.map((food) => {
          const quantity = getQuantity(food.id);
          return (
            <div className="menu-food-card" key={food.id}>
              <div className="menu-food-image-container">
                <img src={getImageUrl(food)} alt={food.name} className="menu-food-image" onError={(e) => { e.currentTarget.src = fallbackImage; }} />
                <span className="menu-food-category">{food.category === "VEG" ? "🟢 VEG" : "🔴 NON-VEG"}</span>
              </div>
              <div className="menu-food-content">
                <h2>{food.name}</h2>
                <p>{food.description || "Delicious and freshly prepared meal."}</p>
                <div className="menu-food-bottom">
                  <span className="menu-food-price">₹{food.price}</span>
                  {food.available === false ? (
                    <button className="menu-unavailable-button" disabled>Out of Stock</button>
                  ) : quantity === 0 ? (
                    <button className="menu-add-button" onClick={() => addToCart(food)}>+ Add</button>
                  ) : (
                    <div className="quantity-control">
                      <button type="button" className="quantity-button" onClick={() => removeFromCart(food.id)}>−</button>
                      <span className="quantity-number">{quantity}</span>
                      <button type="button" className="quantity-button" onClick={() => addToCart(food)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Menu;

