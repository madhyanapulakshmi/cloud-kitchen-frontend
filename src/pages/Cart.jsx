import { Link } from "react-router-dom";
import { getFoodImage } from "../utils/foodImages";
import "./Pages.css";

function Cart({ cart, addToCart, removeFromCart }) {

  const itemTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  const delivery = cart.length > 0 ? 40 : 0;

  const taxes = cart.length > 0
    ? Math.round(itemTotal * 0.05)
    : 0;

  const total = itemTotal + delivery + taxes;

  if (cart.length === 0) {
    return (
      <div className="cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h1>Your cart is empty</h1>

          <p>
            Add some delicious food from our menu.
          </p>

          <Link
            to="/menu"
            className="cart-primary-button"
          >
            Browse Menu
          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="cart-page">

      <div className="cart-page-header">
        <span className="section-label">
          YOUR ORDER
        </span>

        <h1>Shopping Cart</h1>

        <p>
          Review your items before checkout.
        </p>
      </div>

      <div className="cart-layout">

        {/* =========================
            CART ITEMS
        ========================== */}

        <div className="cart-items">

          {cart.map((item) => (

            <div
              className="cart-item"
              key={item.id}
            >

              <div className="cart-item-image">

                <img
                  src={getFoodImage(item)}
                  alt={item.name}
                />

              </div>

              <div className="cart-item-details">

                <h2>{item.name}</h2>

                <p>
                  ₹{item.price} each
                </p>

                <div className="cart-quantity-control">

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart(item)
                    }
                  >
                    +
                  </button>

                </div>

              </div>

              <div className="cart-item-total">

                <strong>
                  ₹
                  {(
                    Number(item.price) *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>

            </div>

          ))}

        </div>

        {/* =========================
            ORDER SUMMARY
        ========================== */}

        <div className="cart-summary">

          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Item total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>₹{delivery}</span>
          </div>

          <div className="summary-row">
            <span>Taxes</span>
            <span>₹{taxes}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total</span>
            <strong>
              ₹{total.toFixed(2)}
            </strong>
          </div>

          <Link
            to="/checkout"
            className="checkout-button"
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/menu"
            className="continue-shopping"
          >
            ← Continue Shopping
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Cart;

