import { useEffect, useState } from "react";
import axios from "axios";
import "./Orders.css";

const API = "http://localhost:8081/api";

const TRACKING_STEPS = [
  {
    key: "PLACED",
    label: "Order Placed",
    icon: "📝",
  },
  {
    key: "PREPARING",
    label: "Preparing",
    icon: "👨‍🍳",
  },
  {
    key: "READY",
    label: "Ready",
    icon: "🍱",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: "🛵",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: "🏠",
  },
];

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invoiceOrder, setInvoiceOrder] =
    useState(null);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API}/orders/user/${user.id}`
      );

      setOrders(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.put(
        `${API}/orders/${orderId}/cancel`
      );

      await loadOrders();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to cancel this order."
      );
    }
  };

  const getSubtotal = (order) => {
    if (
      order.subtotal !== undefined &&
      order.subtotal !== null
    ) {
      return Number(order.subtotal);
    }

    return (order.items || []).reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  };

  const getDeliveryFee = (order) => {
    if (
      order.deliveryFee !== undefined &&
      order.deliveryFee !== null
    ) {
      return Number(order.deliveryFee);
    }

    return 40;
  };

  const getTax = (order) => {
    if (
      order.taxAmount !== undefined &&
      order.taxAmount !== null
    ) {
      return Number(order.taxAmount);
    }

    return 10;
  };

  const getTotal = (order) => {
    if (
      order.totalAmount !== undefined &&
      order.totalAmount !== null
    ) {
      return Number(order.totalAmount);
    }

    return (
      getSubtotal(order) +
      getDeliveryFee(order) +
      getTax(order)
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusIndex = (status) => {
    return TRACKING_STEPS.findIndex(
      (step) => step.key === status
    );
  };

  const getProgressPercent = (status) => {
    const index = getStatusIndex(status);

    if (index < 0) {
      return 0;
    }

    return (
      (index /
        (TRACKING_STEPS.length - 1)) *
      100
    );
  };

  const renderTracker = (order) => {
    const currentIndex = getStatusIndex(
      order.status
    );

    const progress =
      getProgressPercent(order.status);

    if (order.status === "CANCELLED") {
      return (
        <div className="cancelled-tracker">
          <div className="cancelled-tracker-icon">
            ✕
          </div>

          <div>
            <strong>Order Cancelled</strong>
            <p>
              This order is no longer being
              processed.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="order-tracker">

        <div className="tracker-line">
          <div
            className="tracker-line-progress"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {TRACKING_STEPS.map(
          (step, index) => {
            const completed =
              index <= currentIndex;

            const current =
              index === currentIndex;

            return (
              <div
                className={`tracker-step-wrapper ${
                  completed
                    ? "completed"
                    : ""
                } ${
                  current
                    ? "current"
                    : ""
                }`}
                key={step.key}
              >
                <div className="tracker-step">
                  <div className="tracker-icon">
                    {completed &&
                    index <
                      currentIndex ? (
                      "✓"
                    ) : (
                      step.icon
                    )}
                  </div>

                  <div className="tracker-label">
                    {step.label}
                  </div>

                  {current && (
                    <div className="tracker-current">
                      Current
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}

      </div>
    );
  };

  const printInvoice = (order) => {
    setInvoiceOrder(order);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-empty">
          <div className="orders-empty-icon">
            🔐
          </div>

          <h2>Please Login</h2>

          <p>
            Login to view your order history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="loading-spinner" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">

      <div className="orders-header">
        <span className="orders-header-icon">
          📦
        </span>

        <div>
          <p className="orders-eyebrow">
            CLOUDKITCHEN
          </p>

          <h1>Your Orders</h1>

          <p>
            Track your food from the kitchen
            to your doorstep.
          </p>
        </div>
      </div>

      {error && (
        <div className="orders-error">
          {error}

          <button
            type="button"
            onClick={loadOrders}
          >
            Try Again
          </button>
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="orders-empty">
          <div className="orders-empty-icon">
            🍽️
          </div>

          <h2>No Orders Yet</h2>

          <p>
            Your delicious orders will appear
            here once you place one.
          </p>
        </div>
      )}

      <div className="orders-list">

        {orders.map((order) => (
          <article
            className="order-card"
            key={order.id}
          >

            <div className="order-card-top">

              <div>
                <span className="order-id">
                  ORDER #{order.id}
                </span>

                <h2>
                  {order.items?.length || 0}{" "}
                  {order.items?.length === 1
                    ? "Item"
                    : "Items"}
                </h2>

                <p>
                  {formatDate(
                    order.orderDate
                  )}
                </p>
              </div>

              <div className="order-total-top">
                <span>Total</span>

                <strong>
                  ₹
                  {getTotal(order).toFixed(
                    2
                  )}
                </strong>
              </div>

            </div>

            <div className="tracker-section">

              <div className="tracker-heading">
                <div>
                  <h3>
                    Order Tracking
                  </h3>

                  <p>
                    {order.status ===
                    "DELIVERED"
                      ? "Your order has been delivered."
                      : `Current status: ${formatStatus(
                          order.status
                        )}`}
                  </p>
                </div>

                <span
                  className={`order-status-pill status-${order.status?.toLowerCase()}`}
                >
                  {formatStatus(
                    order.status
                  )}
                </span>
              </div>

              {renderTracker(order)}

            </div>

            <div className="order-items-section">

              <h3>Order Items</h3>

              <div className="order-items-list">

                {(order.items || []).map(
                  (item) => (
                    <div
                      className="customer-order-item"
                      key={item.id}
                    >

                      <div className="customer-item-icon">
                        🍴
                      </div>

                      <div className="customer-item-info">
                        <strong>
                          {item.food?.name ||
                            "Food Item"}
                        </strong>

                        <span>
                          ₹
                          {Number(
                            item.price || 0
                          ).toFixed(2)}{" "}
                          × {item.quantity}
                        </span>
                      </div>

                      <strong>
                        ₹
                        {(
                          Number(
                            item.price || 0
                          ) *
                          Number(
                            item.quantity || 0
                          )
                        ).toFixed(2)}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>

            <div className="order-bottom">

              <div className="payment-box">
                <span>
                  Payment
                </span>

                <strong>
                  {order.paymentMethod ||
                    "COD"}
                </strong>

                <small
                  className={
                    order.paymentStatus ===
                    "PAID"
                      ? "paid"
                      : "pending"
                  }
                >
                  {order.paymentStatus ||
                    "PENDING"}
                </small>
              </div>

              <div className="price-box">

                <div>
                  <span>
                    Item Subtotal
                  </span>

                  <strong>
                    ₹
                    {getSubtotal(
                      order
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>
                    Delivery Fee
                  </span>

                  <strong>
                    ₹
                    {getDeliveryFee(
                      order
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>
                    GST
                  </span>

                  <strong>
                    ₹
                    {getTax(order).toFixed(
                      2
                    )}
                  </strong>
                </div>

                <div className="final-total">
                  <span>
                    Grand Total
                  </span>

                  <strong>
                    ₹
                    {getTotal(
                      order
                    ).toFixed(2)}
                  </strong>
                </div>

              </div>

            </div>

            <div className="order-actions">

              <button
                type="button"
                className="invoice-button"
                onClick={() =>
                  setInvoiceOrder(order)
                }
              >
                📄 View Invoice
              </button>

              <button
                type="button"
                className="print-button"
                onClick={() =>
                  printInvoice(order)
                }
              >
                🖨️ Print Invoice
              </button>

              {order.status ===
                "PLACED" && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    cancelOrder(
                      order.id
                    )
                  }
                >
                  Cancel Order
                </button>
              )}

            </div>

          </article>
        ))}

      </div>

      {invoiceOrder && (
        <div
          className="invoice-overlay"
          onClick={() =>
            setInvoiceOrder(null)
          }
        >
          <div
            className="invoice-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="invoice-close"
              onClick={() =>
                setInvoiceOrder(null)
              }
            >
              ×
            </button>

            <div className="invoice-brand">
              <div>🍴</div>

              <h2>
                CloudKitchen
              </h2>

              <p>
                Restaurant Order Invoice
              </p>
            </div>

            <div className="invoice-info-grid">

              <div>
                <span>
                  Order ID
                </span>

                <strong>
                  #{invoiceOrder.id}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formatDate(
                    invoiceOrder.orderDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {user.name}
                </strong>
              </div>

              <div>
                <span>
                  Payment
                </span>

                <strong>
                  {invoiceOrder.paymentMethod ||
                    "COD"}
                </strong>
              </div>

            </div>

            <div className="invoice-items">

              {(invoiceOrder.items || []).map(
                (item) => (
                  <div
                    key={item.id}
                    className="invoice-item"
                  >
                    <div>
                      <strong>
                        {item.food?.name ||
                          "Food Item"}
                      </strong>

                      <span>
                        {item.quantity} × ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                      </span>
                    </div>

                    <strong>
                      ₹
                      {(
                        Number(
                          item.price || 0
                        ) *
                        Number(
                          item.quantity || 0
                        )
                      ).toFixed(2)}
                    </strong>
                  </div>
                )
              )}

            </div>

            <div className="invoice-summary">

              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  ₹
                  {getSubtotal(
                    invoiceOrder
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Delivery Fee
                </span>

                <strong>
                  ₹
                  {getDeliveryFee(
                    invoiceOrder
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  GST
                </span>

                <strong>
                  ₹
                  {getTax(
                    invoiceOrder
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="invoice-total">
                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {getTotal(
                    invoiceOrder
                  ).toFixed(2)}
                </strong>
              </div>

            </div>

            <div className="invoice-thanks">
              Thank you for ordering with
              CloudKitchen ❤️
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Orders;

