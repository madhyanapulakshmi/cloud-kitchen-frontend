import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFoodImage } from "../utils/foodImages";
import "./Home.css";

function Home({
  foods,
  cart,
  addToCart,
  removeFromCart,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = food.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "ALL" ||
        food.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [foods, search, category]);

  const getQuantity = (foodId) => {
    const item = cart.find(
      (item) => item.id === foodId
    );

    return item ? item.quantity : 0;
  };

  return (
    <div className="home-page">

      {/* HERO SECTION */}
      <section className="hero-section">

        <div className="hero-content">

          <span className="hero-badge">
            🍽️ Fresh • Fast • Delicious
          </span>

          <h1>
            Your favourite food,
            <br />
            delivered to your door.
          </h1>

          <p>
            Order delicious meals from your
            favourite restaurants with PreBite.
          </p>

          <div className="hero-actions">

            <Link
              to="/menu"
              className="primary-button"
            >
              Explore Menu
            </Link>

            <Link
              to="/orders"
              className="secondary-button"
            >
              Track Orders
            </Link>

          </div>

        </div>

      </section>

      {/* SEARCH + CATEGORY */}
      <section className="food-section">

        <div className="section-heading">

          <div>

            <span className="section-label">
              OUR MENU
            </span>

            <h2>
              Popular Foods
            </h2>

            <p>
              Choose from our delicious selection.
            </p>

          </div>

          <Link
            to="/menu"
            className="view-menu-link"
          >
            View Full Menu →
          </Link>

        </div>

        <div className="food-controls">

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search for food..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <div className="category-buttons">

            <button
              className={
                category === "ALL"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategory("ALL")
              }
            >
              All
            </button>

            <button
              className={
                category === "VEG"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategory("VEG")
              }
            >
              🟢 Veg
            </button>

            <button
              className={
                category === "NON_VEG"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategory("NON_VEG")
              }
            >
              🔴 Non-Veg
            </button>

          </div>

        </div>

        {/* FOOD GRID */}
        <div className="food-grid">

          {filteredFoods.length > 0 ? (

            filteredFoods.map((food) => {

              const quantity =
                getQuantity(food.id);

              const unavailable =
                food.available === false;

              return (

                <div
                  className="food-card"
                  key={food.id}
                >

                  <div className="food-image-container">

                    <img
                      src={getFoodImage(food)}
                      alt={food.name}
                      className="food-image"
                    />

                    <span className="food-category">
                      {food.category === "VEG"
                        ? "🟢 VEG"
                        : "🔴 NON-VEG"}
                    </span>

                    {unavailable && (
                      <div className="food-unavailable-overlay">
                        <span>
                          OUT OF STOCK
                        </span>
                      </div>
                    )}

                  </div>

                  <div className="food-card-content">

                    <h3>
                      {food.name}
                    </h3>

                    <p className="food-description">
                      {food.description ||
                        "Delicious and freshly prepared meal."}
                    </p>

                    <div className="food-card-bottom">

                      <span className="food-price">
                        ₹{Number(food.price || 0).toFixed(0)}
                      </span>

                      {unavailable ? (

                        <button
                          className="add-cart-button unavailable"
                          disabled
                        >
                          Unavailable
                        </button>

                      ) : quantity === 0 ? (

                        <button
                          className="add-cart-button"
                          onClick={() =>
                            addToCart(food)
                          }
                        >
                          + Add
                        </button>

                      ) : (

                        <div className="home-quantity-control">

                          <button
                            type="button"
                            className="home-quantity-button"
                            onClick={() =>
                              removeFromCart(
                                food.id
                              )
                            }
                          >
                            −
                          </button>

                          <span className="home-quantity-number">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            className="home-quantity-button"
                            onClick={() =>
                              addToCart(food)
                            }
                          >
                            +
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              );
            })

          ) : (

            <div className="no-foods">

              <div>🍽️</div>

              <h3>
                No food found
              </h3>

              <p>
                Try another food name or category.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* FEATURES */}
      <section className="features-section">

        <div className="feature-card">

          <div className="feature-icon">
            🚀
          </div>

          <h3>
            Fast Delivery
          </h3>

          <p>
            Get your favourite food delivered quickly.
          </p>

        </div>

        <div className="feature-card">

          <div className="feature-icon">
            🍴
          </div>

          <h3>
            Fresh Food
          </h3>

          <p>
            Freshly prepared meals from our kitchen.
          </p>

        </div>

        <div className="feature-card">

          <div className="feature-icon">
            💳
          </div>

          <h3>
            Easy Ordering
          </h3>

          <p>
            Simple and convenient online ordering.
          </p>

        </div>

        <div className="feature-card">

          <div className="feature-icon">
            📦
          </div>

          <h3>
            Order Tracking
          </h3>

          <p>
            Track your order status anytime.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Home;