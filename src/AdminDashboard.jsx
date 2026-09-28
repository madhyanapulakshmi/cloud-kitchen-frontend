import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "https://cloud-kitchen-backend-production.up.railway.app/api";

const STATUS_FLOW = [
  "PLACED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const fallbackImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle"
        font-size="90">🍽️</text>
      <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle"
        font-size="28" fill="#6b7280">Food Image</text>
    </svg>
  `);

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  const value = String(imageUrl).trim();

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return value.startsWith("/") ? value : `/${value}`;
};

function AdminDashboard() {
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  const [orderSearch, setOrderSearch] = useState("");
  const [foodSearch, setFoodSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [newOrder, setNewOrder] = useState(null);
  const [showNewOrderPopup, setShowNewOrderPopup] = useState(false);

  const [knownOrderIds, setKnownOrderIds] = useState([]);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const [foodForm, setFoodForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
    imageFile: null,
    imagePreview: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingFood, setSavingFood] = useState(false);
  const [changingAvailability, setChangingAvailability] =
    useState(null);

  useEffect(() => {
    loadFoods();
    loadOrders();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewOrders();
    }, 8000);

    return () => clearInterval(interval);
  }, [knownOrderIds]);

  const loadFoods = async () => {
    try {
      const response = await axios.get(`${API}/foods`);
      setFoods(response.data || []);
    } catch (error) {
      console.error("Failed to load foods:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API}/orders`);
      const latestOrders = response.data || [];

      setOrders(latestOrders);

      if (knownOrderIds.length === 0) {
        setKnownOrderIds(
          latestOrders.map((order) => order.id)
        );
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const latestOrders = response.data || [];

      const currentIds = latestOrders.map(
        (order) => order.id
      );

      const newPlacedOrder = latestOrders.find(
        (order) =>
          !knownOrderIds.includes(order.id) &&
          order.status === "PLACED"
      );

      setOrders(latestOrders);
      setKnownOrderIds(currentIds);

      if (newPlacedOrder) {
        setNewOrder(newPlacedOrder);
        setShowNewOrderPopup(true);
      }
    } catch (error) {
      console.error(
        "Failed to check new orders:",
        error
      );
    }
  };

  const getCustomerName = (order) => {
    return (
      order?.user?.name ||
      order?.user?.email ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return order?.user?.email || "No email";
  };

  const formatStatus = (status) => {
    return String(status || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replaceAll("_", "-");
  };

  const getStatusAction = (status) => {
    switch (status) {
      case "PLACED":
        return {
          label: "✓ Accept Order",
          next: "PREPARING",
          className: "status-action accept",
        };

      case "PREPARING":
        return {
          label: "✓ Mark Ready",
          next: "READY",
          className: "status-action ready",
        };

      case "READY":
        return {
          label: "🚚 Send for Delivery",
          next: "OUT_FOR_DELIVERY",
          className: "status-action delivery",
        };

      case "OUT_FOR_DELIVERY":
        return {
          label: "✓ Mark Delivered",
          next: "DELIVERED",
          className: "status-action delivered",
        };

      default:
        return null;
    }
  };

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/status`,
        {
          status,
        }
      );

      await loadOrders();

      if (
        selectedOrder &&
        selectedOrder.id === orderId
      ) {
        const response = await axios.get(
          `${API}/orders/${orderId}`
        );

        setSelectedOrder(response.data);
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update order status."
      );
    }
  };

  const handleStatusAction = async (order) => {
    const action = getStatusAction(order.status);

    if (!action) return;

    await updateOrderStatus(
      order.id,
      action.next
    );
  };

  const acceptOrder = async (order) => {
    await updateOrderStatus(
      order.id,
      "PREPARING"
    );

    setShowNewOrderPopup(false);
    setNewOrder(null);
  };

  const openOrder = async (order) => {
    try {
      const response = await axios.get(
        `${API}/orders/${order.id}`
      );

      setSelectedOrder(response.data);
      setShowOrderModal(true);
    } catch (error) {
      console.error(error);

      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const filteredOrders = useMemo(() => {
    const search = orderSearch
      .trim()
      .toLowerCase();

    if (!search) return orders;

    return orders.filter((order) => {
      const orderId = String(
        order.id || ""
      ).toLowerCase();

      const customerName =
        getCustomerName(order).toLowerCase();

      const customerEmail =
        getCustomerEmail(order).toLowerCase();

      const status =
        String(order.status || "").toLowerCase();

      return (
        orderId.includes(search) ||
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        status.includes(search)
      );
    });
  }, [orders, orderSearch]);

  const filteredFoods = useMemo(() => {
    const search = foodSearch
      .trim()
      .toLowerCase();

    if (!search) return foods;

    return foods.filter((food) => {
      return (
        String(food.name || "")
          .toLowerCase()
          .includes(search) ||
        String(food.category || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [foods, foodSearch]);

  const getOrderTotal = (order) => {
    if (order.totalAmount != null) {
      return Number(order.totalAmount);
    }

    return (
      Number(order.subtotal || 0) +
      Number(order.deliveryFee || 40) +
      Number(order.taxAmount || 10)
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const openAddFood = () => {
    setEditingFood(null);

    setFoodForm({
      name: "",
      description: "",
      price: "",
      category: "",
      available: true,
      imageFile: null,
      imagePreview: "",
    });

    setShowFoodModal(true);
  };

  const openEditFood = (food) => {
    setEditingFood(food);

    setFoodForm({
      name: food.name || "",
      description: food.description || "",
      price: food.price ?? "",
      category: food.category || "",
      available: food.available !== false,
      imageFile: null,
      imagePreview: food.imageUrl || "",
    });

    setShowFoodModal(true);
  };

  const handleFoodChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFoodForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setFoodForm((current) => ({
        ...current,
        imageFile: null,
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setFoodForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: previewUrl,
    }));
  };

  const saveFood = async (event) => {
    event.preventDefault();

    try {
      setSavingFood(true);

      if (!foodForm.name.trim()) {
        alert("Please enter food name.");
        return;
      }

      if (
        foodForm.price === "" ||
        Number(foodForm.price) < 0
      ) {
        alert("Please enter a valid price.");
        return;
      }

      if (
        !editingFood &&
        !foodForm.imageFile
      ) {
        alert("Please upload a food image.");
        return;
      }

      const formData = new FormData();

      formData.append(
        "name",
        foodForm.name.trim()
      );

      formData.append(
        "description",
        foodForm.description || ""
      );

      formData.append(
        "price",
        String(Number(foodForm.price))
      );

      formData.append(
        "category",
        foodForm.category || ""
      );

      formData.append(
        "available",
        String(foodForm.available)
      );

      if (foodForm.imageFile) {
        formData.append(
          "image",
          foodForm.imageFile
        );
      }

      if (editingFood) {
        await axios.put(
          `${API}/foods/${editingFood.id}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      } else {
        await axios.post(
          `${API}/foods`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      setShowFoodModal(false);
      setEditingFood(null);

      setFoodForm({
        name: "",
        description: "",
        price: "",
        category: "",
        available: true,
        imageFile: null,
        imagePreview: "",
      });

      await loadFoods();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save food."
      );
    } finally {
      setSavingFood(false);
    }
  };

  const toggleAvailability = async (food) => {
    const currentAvailable =
      food.available !== false;

    const newAvailable =
      !currentAvailable;

    try {
      setChangingAvailability(food.id);

      await axios.put(
        `${API}/foods/${food.id}/availability`,
        null,
        {
          params: {
            available: newAvailable,
          },
        }
      );

      setFoods((currentFoods) =>
        currentFoods.map((item) =>
          item.id === food.id
            ? {
                ...item,
                available: newAvailable,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to change food availability."
      );
    } finally {
      setChangingAvailability(null);
    }
  };

  const deleteFood = async (foodId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this food item?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API}/foods/${foodId}`
      );

      await loadFoods();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete food."
      );
    }
  };

  const totalOrders = orders.length;

  const placedOrders = orders.filter(
    (order) => order.status === "PLACED"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "PREPARING"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const totalRevenue = orders
    .filter(
      (order) =>
        order.status !== "CANCELLED"
    )
    .reduce(
      (sum, order) =>
        sum + getOrderTotal(order),
      0
    );

  return (
    <div className="admin-page">

      {/* OWNER HEADER */}

      <section className="owner-hero">
        <div className="owner-hero-icon">
          👨‍🍳
        </div>

        <div>
          <p className="owner-hero-label">
            CLOUDKITCHEN MANAGEMENT
          </p>

          <h1>Owner Dashboard</h1>

          <p className="owner-hero-subtitle">
            Manage orders, menu items and
            restaurant operations
          </p>
        </div>
      </section>

      {/* TABS */}

      <div className="admin-tabs">

        <button
          className={
            activeTab === "overview"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("overview")
          }
        >
          📊 Overview
        </button>

        <button
          className={
            activeTab === "orders"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("orders")
          }
        >
          🧾 Orders
        </button>

        <button
          className={
            activeTab === "menu"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("menu")
          }
        >
          🍽️ Menu
        </button>

      </div>

      {/* OVERVIEW */}

      {activeTab === "overview" && (
        <section className="admin-section">

          <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon">
                🧾
              </div>

              <div>
                <span>Total Orders</span>
                <strong>{totalOrders}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                🔔
              </div>

              <div>
                <span>New Orders</span>
                <strong>{placedOrders}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                👨‍🍳
              </div>

              <div>
                <span>Preparing</span>

                <strong>
                  {preparingOrders}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                💰
              </div>

              <div>
                <span>Revenue</span>

                <strong>
                  ₹{totalRevenue.toFixed(0)}
                </strong>
              </div>
            </div>

          </div>

          <div className="admin-panel">

            <div className="panel-heading">

              <div>
                <h2>Recent Orders</h2>

                <p>
                  Latest customer activity
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  setActiveTab("orders")
                }
              >
                View All Orders
              </button>

            </div>

            {orders.length === 0 ? (
              <div className="empty-state">

                <div>🧾</div>

                <h3>No orders yet</h3>

                <p>
                  Customer orders will appear
                  here.
                </p>

              </div>
            ) : (
              <div className="recent-orders">

                {orders
                  .slice(0, 5)
                  .map((order) => {

                    const action =
                      getStatusAction(
                        order.status
                      );

                    return (
                      <div
                        className="recent-order"
                        key={order.id}
                      >

                        <div className="recent-order-main">

                          <strong>
                            Order #{order.id}
                          </strong>

                          <span>
                            {getCustomerName(
                              order
                            )}
                          </span>

                        </div>

                        <div className="recent-order-right">

                          <span
                            className={`status-badge ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>

                          <strong>
                            ₹
                            {getOrderTotal(
                              order
                            ).toFixed(0)}
                          </strong>

                          {action && (
                            <button
                              className={
                                action.className
                              }
                              onClick={() =>
                                handleStatusAction(
                                  order
                                )
                              }
                            >
                              {action.label}
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  })}

              </div>
            )}

          </div>

        </section>
      )}

      {/* ORDERS */}

      {activeTab === "orders" && (
        <section className="admin-section">

          <div className="section-title-row">

            <div>
              <h2>Order Management</h2>

              <p>
                Manage the complete order
                delivery flow
              </p>
            </div>

          </div>

          <div
            className="order-search-wrapper"
            style={{
              background: "#ffffff",
              border: "2px solid #e5e7eb",
              borderRadius: "14px",
            }}
          >

            <span className="search-icon">
              🔎
            </span>

            <input
              type="text"
              value={orderSearch}
              onChange={(event) =>
                setOrderSearch(
                  event.target.value
                )
              }
              placeholder="Search order ID, customer name, email or status..."
              className="order-search-input"
              style={{
                color: "#111827",
                background: "#ffffff",
                outline: "none",
              }}
            />

            {orderSearch && (
              <button
                className="clear-search"
                onClick={() =>
                  setOrderSearch("")
                }
                type="button"
              >
                ×
              </button>
            )}

          </div>

          <div className="search-result-count">
            Showing {filteredOrders.length} of{" "}
            {orders.length} orders
          </div>

          {loading ? (
            <div className="loading-state">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">

              <div>🔎</div>

              <h3>No matching orders</h3>

              <p>
                Try another order ID,
                customer or status.
              </p>

            </div>
          ) : (
            <div className="orders-grid">

              {filteredOrders.map((order) => {

                const action =
                  getStatusAction(
                    order.status
                  );

                return (
                  <div
                    className="order-card"
                    key={order.id}
                  >

                    <div className="order-card-header">

                      <div>

                        <span className="order-number">
                          Order #{order.id}
                        </span>

                        <span className="order-date">
                          {formatDate(
                            order.orderDate
                          )}
                        </span>

                      </div>

                      <div className="order-header-actions">

                        <span
                          className={`status-badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(
                            order.status
                          )}
                        </span>

                        {action && (
                          <button
                            className={
                              action.className
                            }
                            onClick={() =>
                              handleStatusAction(
                                order
                              )
                            }
                          >
                            {action.label}
                          </button>
                        )}

                      </div>

                    </div>

                    <div className="customer-summary">

                      <div className="customer-avatar">

                        {getCustomerName(
                          order
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                      <div>

                        <strong>
                          {getCustomerName(
                            order
                          )}
                        </strong>

                        <span>
                          {getCustomerEmail(
                            order
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="order-card-details">

                      <div>
                        <span>Items</span>

                        <strong>
                          {order.items?.length ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>Payment</span>

                        <strong>
                          {order.paymentMethod ||
                            "COD"}
                        </strong>
                      </div>

                      <div>
                        <span>Total</span>

                        <strong>
                          ₹
                          {getOrderTotal(
                            order
                          ).toFixed(0)}
                        </strong>
                      </div>

                    </div>

                    <div className="order-actions">

                      <button
                        className="secondary-button"
                        onClick={() =>
                          openOrder(order)
                        }
                      >
                        View Order
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>
      )}

      {/* MENU */}

      {activeTab === "menu" && (
        <section className="admin-section">

          <div className="section-title-row">

            <div>
              <h2>Menu Management</h2>

              <p>
                Add, edit and manage food items
              </p>
            </div>

            <button
              className="primary-button"
              onClick={openAddFood}
            >
              + Add Food
            </button>

          </div>

          <div
            className="menu-search-wrapper"
            style={{
              background: "#ffffff",
              border: "2px solid #e5e7eb",
              borderRadius: "14px",
            }}
          >

            <span>🔎</span>

            <input
              type="text"
              value={foodSearch}
              onChange={(event) =>
                setFoodSearch(
                  event.target.value
                )
              }
              placeholder="Search food or category..."
              style={{
                color: "#111827",
                background: "#ffffff",
                outline: "none",
              }}
            />

          </div>

          {filteredFoods.length === 0 ? (
            <div className="empty-state">

              <div>🍽️</div>

              <h3>No food items found</h3>

              <p>
                Add your first menu item.
              </p>

            </div>
          ) : (
            <div className="food-admin-grid">

              {filteredFoods.map((food) => {

                const image =
                  getImageUrl(
                    food.imageUrl
                  );

                const isAvailable =
                  food.available !== false;

                const isChanging =
                  changingAvailability ===
                  food.id;

                return (
                  <div
                    className="food-admin-card"
                    key={food.id}
                    style={{
                      overflow: "hidden",
                    }}
                  >

                    {/* FOOD IMAGE */}

                    <div
                      className="food-admin-image-wrapper"
                      style={{
                        position: "relative",
                        background: "#f3f4f6",
                      }}
                    >

                      <img
                        src={
                          image || fallbackImage
                        }
                        alt={food.name}
                        className="food-admin-image"
                        onError={(event) => {
                          if (
                            event.currentTarget
                              .dataset
                              .fallbackUsed
                          ) {
                            event.currentTarget.src =
                              fallbackImage;
                            return;
                          }

                          event.currentTarget.dataset.fallbackUsed =
                            "true";

                          event.currentTarget.src =
                            fallbackImage;
                        }}
                      />

                      {!isAvailable && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "rgba(17,24,39,0.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "18px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          OUT OF STOCK
                        </div>
                      )}

                    </div>

                    {/* FOOD CONTENT */}

                    <div className="food-admin-content">

                      <div className="food-admin-top">

                        <span className="food-category">
                          {food.category ||
                            "Food"}
                        </span>

                        <span
                          className={
                            isAvailable
                              ? "available-dot"
                              : "offline-dot"
                          }
                        >
                          ●
                        </span>

                      </div>

                      <h3>{food.name}</h3>

                      <p>
                        {food.description ||
                          "Delicious food item"}
                      </p>

                      {/* PRICE */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          marginTop: "12px",
                          marginBottom: "12px",
                        }}
                      >

                        <strong
                          style={{
                            fontSize: "21px",
                          }}
                        >
                          ₹
                          {Number(
                            food.price || 0
                          ).toFixed(0)}
                        </strong>

                        {/* AVAILABILITY TOGGLE */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleAvailability(
                              food
                            )
                          }
                          disabled={isChanging}
                          title={
                            isAvailable
                              ? "Click to mark Out of Stock"
                              : "Click to make Available"
                          }
                          style={{
                            border: "none",
                            background:
                              "transparent",
                            cursor: isChanging
                              ? "wait"
                              : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "4px 0",
                          }}
                        >

                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color:
                                isAvailable
                                  ? "#15803d"
                                  : "#dc2626",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {isChanging
                              ? "Updating..."
                              : isAvailable
                                ? "Available"
                                : "Out of Stock"}
                          </span>

                          <span
                            style={{
                              width: "42px",
                              height: "23px",
                              borderRadius:
                                "999px",
                              background:
                                isAvailable
                                  ? "#16a34a"
                                  : "#9ca3af",
                              position:
                                "relative",
                              display: "inline-block",
                              transition:
                                "0.2s ease",
                            }}
                          >

                            <span
                              style={{
                                position:
                                  "absolute",
                                top: "3px",
                                left:
                                  isAvailable
                                    ? "22px"
                                    : "3px",
                                width: "17px",
                                height: "17px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#ffffff",
                                boxShadow:
                                  "0 1px 4px rgba(0,0,0,0.25)",
                                transition:
                                  "0.2s ease",
                              }}
                            />

                          </span>

                        </button>

                      </div>

                      {/* ACTION BUTTONS */}

                      <div className="food-admin-bottom">

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            width: "100%",
                          }}
                        >

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditFood(
                                food
                              )
                            }
                            style={{
                              flex: 1,
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteFood(
                                food.id
                              )
                            }
                            style={{
                              flex: 1,
                            }}
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>
      )}

      {/* NEW ORDER POPUP */}

      {showNewOrderPopup &&
        newOrder && (
          <div className="popup-overlay">

            <div className="new-order-popup">

              <div className="new-order-icon">
                🔔
              </div>

              <span className="new-order-label">
                NEW ORDER
              </span>

              <h2>
                Order #{newOrder.id}
              </h2>

              <p className="popup-customer">
                {getCustomerName(newOrder)}
              </p>

              <div className="popup-order-info">

                <div>
                  <span>Total</span>

                  <strong>
                    ₹
                    {getOrderTotal(
                      newOrder
                    ).toFixed(0)}
                  </strong>
                </div>

                <div>
                  <span>Payment</span>

                  <strong>
                    {newOrder.paymentMethod ||
                      "COD"}
                  </strong>
                </div>

              </div>

              <div className="popup-buttons">

                <button
                  className="secondary-button"
                  onClick={() => {
                    setShowNewOrderPopup(
                      false
                    );
                    openOrder(newOrder);
                  }}
                >
                  View Order
                </button>

                <button
                  className="accept-button"
                  onClick={() =>
                    acceptOrder(newOrder)
                  }
                >
                  ✓ Accept Order
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ORDER DETAILS MODAL */}

      {showOrderModal &&
        selectedOrder && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowOrderModal(false)
            }
          >

            <div
              className="order-detail-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                className="modal-close"
                onClick={() =>
                  setShowOrderModal(false)
                }
              >
                ×
              </button>

              <div className="modal-title">

                <div>

                  <span>
                    ORDER DETAILS
                  </span>

                  <h2>
                    Order #
                    {selectedOrder.id}
                  </h2>

                </div>

                <span
                  className={`status-badge ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  {formatStatus(
                    selectedOrder.status
                  )}
                </span>

              </div>

              {/* CUSTOMER */}

              <div className="detail-section">

                <h3>Customer</h3>

                <div className="detail-customer">

                  <div className="customer-avatar large">

                    {getCustomerName(
                      selectedOrder
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div>

                    <strong>
                      {getCustomerName(
                        selectedOrder
                      )}
                    </strong>

                    <span>
                      {getCustomerEmail(
                        selectedOrder
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* ADDRESS */}

              <div className="detail-section">

                <h3>Delivery Address</h3>

                <div className="address-box">

                  <p>
                    <strong>House:</strong>{" "}
                    {selectedOrder.houseNumber ||
                      "-"}
                  </p>

                  <p>
                    <strong>Street:</strong>{" "}
                    {selectedOrder.street ||
                      "-"}
                  </p>

                  <p>
                    <strong>Area:</strong>{" "}
                    {selectedOrder.area ||
                      "-"}
                  </p>

                  <p>
                    <strong>Village:</strong>{" "}
                    {selectedOrder.village ||
                      "-"}
                  </p>

                  <p>
                    <strong>District:</strong>{" "}
                    {selectedOrder.district ||
                      "-"}
                  </p>

                  <p>
                    <strong>PIN:</strong>{" "}
                    {selectedOrder.pincode ||
                      "-"}
                  </p>

                  <p>
                    <strong>Landmark:</strong>{" "}
                    {selectedOrder.landmark ||
                      "-"}
                  </p>

                </div>

                {selectedOrder.latitude &&
                  selectedOrder.longitude && (
                    <a
                      className="location-button"
                      href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📍 Open Customer Location
                    </a>
                  )}

                {getStatusAction(
                  selectedOrder.status
                ) && (
                  <button
                    className={
                      getStatusAction(
                        selectedOrder.status
                      ).className
                    }
                    style={{
                      width: "100%",
                      marginTop: "12px",
                    }}
                    onClick={() =>
                      handleStatusAction(
                        selectedOrder
                      )
                    }
                  >
                    {
                      getStatusAction(
                        selectedOrder.status
                      ).label
                    }
                  </button>
                )}

              </div>

              {/* ITEMS */}

              <div className="detail-section">

                <h3>Ordered Items</h3>

                <div className="detail-items">

                  {(selectedOrder.items ||
                    []).map((item) => (

                    <div
                      className="detail-item"
                      key={item.id}
                    >

                      <div>

                        <strong>
                          {item.food?.name ||
                            "Food"}
                        </strong>

                        <span>
                          ₹
                          {Number(
                            item.price ||
                              item.food?.price ||
                              0
                          ).toFixed(0)}
                          {" × "}
                          {item.quantity}
                        </span>

                      </div>

                      <strong>
                        ₹
                        {(
                          Number(
                            item.price ||
                              item.food?.price ||
                              0
                          ) *
                          Number(
                            item.quantity || 0
                          )
                        ).toFixed(0)}
                      </strong>

                    </div>

                  ))}

                </div>

              </div>

              {/* TOTAL */}

              <div className="detail-total">

                <div>
                  <span>Subtotal</span>

                  <strong>
                    ₹
                    {Number(
                      selectedOrder.subtotal ||
                        0
                    ).toFixed(0)}
                  </strong>
                </div>

                <div>
                  <span>Delivery Fee</span>

                  <strong>
                    ₹
                    {Number(
                      selectedOrder.deliveryFee ||
                        0
                    ).toFixed(0)}
                  </strong>
                </div>

                <div>
                  <span>GST</span>

                  <strong>
                    ₹
                    {Number(
                      selectedOrder.taxAmount ||
                        0
                    ).toFixed(0)}
                  </strong>
                </div>

                <div className="grand-total">

                  <span>Total</span>

                  <strong>
                    ₹
                    {getOrderTotal(
                      selectedOrder
                    ).toFixed(0)}
                  </strong>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* FOOD MODAL */}

      {showFoodModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowFoodModal(false)
          }
        >

          <div
            className="food-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowFoodModal(false)
              }
            >
              ×
            </button>

            <div className="modal-title">

              <div>

                <span>
                  MENU MANAGEMENT
                </span>

                <h2>
                  {editingFood
                    ? "Edit Food"
                    : "Add Food"}
                </h2>

              </div>

            </div>

            <form
              onSubmit={saveFood}
              className="food-form"
            >

              {/* NAME + CATEGORY */}

              <div className="form-row">

                <div className="admin-form-group">

                  <label>
                    Food Name
                  </label>

                  <input
                    name="name"
                    value={foodForm.name}
                    onChange={
                      handleFoodChange
                    }
                    placeholder="Enter food name"
                    required
                  />

                </div>

                <div className="admin-form-group">

                  <label>
                    Category
                  </label>

                  <input
                    name="category"
                    value={
                      foodForm.category
                    }
                    onChange={
                      handleFoodChange
                    }
                    placeholder="Biryani, Pizza..."
                    required
                  />

                </div>

              </div>

              {/* PRICE + IMAGE */}

              <div className="form-row">

                <div className="admin-form-group">

                  <label>
                    Price
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={foodForm.price}
                    onChange={
                      handleFoodChange
                    }
                    placeholder="Enter price"
                    required
                  />

                </div>

                <div className="admin-form-group">

                  <label>
                    Food Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    {editingFood
                      ? "Upload a new image only if you want to replace the existing image."
                      : "Upload JPG, PNG, WEBP or another image. Maximum 5 MB."}
                  </small>

                </div>

              </div>

              {/* IMAGE PREVIEW */}

              {foodForm.imagePreview && (
                <div
                  style={{
                    marginBottom: "18px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border:
                      "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >

                  <div
                    style={{
                      padding: "10px 12px",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    Image Preview
                  </div>

                  <img
                    src={
                      foodForm.imagePreview
                    }
                    alt="Food preview"
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "cover",
                    }}
                    onError={(event) => {
                      event.currentTarget.src =
                        fallbackImage;
                    }}
                  />

                </div>
              )}

              {/* DESCRIPTION */}

              <div className="admin-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    foodForm.description
                  }
                  onChange={
                    handleFoodChange
                  }
                  placeholder="Describe the food..."
                  rows="4"
                />

              </div>

              {/* AVAILABILITY */}

              <label
                className="availability-check"
                style={{
                  cursor: "pointer",
                }}
              >

                <input
                  type="checkbox"
                  name="available"
                  checked={
                    foodForm.available
                  }
                  onChange={
                    handleFoodChange
                  }
                />

                <span>
                  Food is currently available
                </span>

              </label>

              {/* SAVE */}

              <button
                type="submit"
                className="modal-action-button"
                disabled={savingFood}
              >
                {savingFood
                  ? "Saving..."
                  : editingFood
                    ? "Update Food"
                    : "Add Food"}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminDashboard;