import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home({ foods, cart, addToCart, removeFromCart }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const fallbackImage =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

  const getImageUrl = (food) => {
    const value = String(food?.imageUrl || "").trim();
    if (!value) return fallbackImage;
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) return value;
    return `https://cloud-kitchen-backend-production.up.railway.app${value.startsWith("/") ? value : `/${value}`}`;
  };

  const getQuantity = (foodId) => {
    const item = (cart || []).find((item) => item.id === foodId);
    return item ? item.quantity : 0;
  };

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "ALL" || food.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [foods, search, category]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">🍽️ Fresh • Fast • Delicious</span>
          <h1>Your favourite food,<br />delivered to your door.</h1>
          <p>Order delicious meals from your favourite restaurants with PreBite.</p>
          <div className="hero-actions">
            <Link to="/menu" className="primary-button">Explore Menu</Link>
            <Link to="/orders" className="secondary-button">Track Orders</Link>
          </div>
        </div>
      </section>

      <section className="food-section">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR MENU</span>
            <h2>Popular Foods</h2>
            <p>Choose from our delicious selection.</p>
          </div>
          <Link to="/menu" className="view-menu-link">View Full Menu →</Link>
        </div>

        <div className="food-controls">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search for food..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="category-buttons">
            <button className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}>All</button>
            <button className={category === "VEG" ? "active" : ""} onClick={() => setCategory("VEG")}>🟢 Veg</button>
            <button className={category === "NON_VEG" ? "active" : ""} onClick={() => setCategory("NON_VEG")}>🔴 Non-Veg</button>
          </div>
        </div>

        <div className="food-grid">
          {filteredFoods.length > 0 ? filteredFoods.map((food) => {
            const quantity = getQuantity(food.id);
            return (
              <div className="food-card" key={food.id}>
                <div className="food-image-container">
                  <img
                    src={getImageUrl(food)}
                    alt={food.name}
                    className="food-image"
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                  />
                  <span className="food-category">{food.category === "VEG" ? "🟢 VEG" : "🔴 NON-VEG"}</span>
                </div>
                <div className="food-card-content">
                  <h3>{food.name}</h3>
                  <p className="food-description">{food.description || "Delicious and freshly prepared meal."}</p>
                  <div className="food-card-bottom">
                    <span className="food-price">₹{food.price}</span>
                    {food.available === false ? (
                      <button className="add-cart-button" disabled>Out of Stock</button>
                    ) : quantity === 0 ? (
                      <button className="add-cart-button" onClick={() => addToCart(food)}>+ Add</button>
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
          }) : (
            <div className="no-foods"><div>🍽️</div><h3>No food found</h3><p>Try another food name or category.</p></div>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="feature-card"><div className="feature-icon">🚀</div><h3>Fast Delivery</h3><p>Get your favourite food delivered quickly.</p></div>
        <div className="feature-card"><div className="feature-icon">🍴</div><h3>Fresh Food</h3><p>Freshly prepared meals from our kitchen.</p></div>
        <div className="feature-card"><div className="feature-icon">💳</div><h3>Easy Ordering</h3><p>Simple and convenient online ordering.</p></div>
        <div className="feature-card"><div className="feature-icon">📦</div><h3>Order Tracking</h3><p>Track your order status anytime.</p></div>
      </section>
    </div>
  );
}

export default Home;

