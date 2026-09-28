import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

const API = "https://cloud-kitchen-backend-production.up.railway.app/api";

function Checkout({ user, cart, clearCart }) {
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] =
    useState([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState(null);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [addressForm, setAddressForm] = useState({
    houseNumber: "",
    street: "",
    area: "",
    village: "",
    district: "",
    pincode: "",
    landmark: "",
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] =
    useState(false);

  /*
   * Load saved addresses.
   *
   * If browser storage doesn't contain an address,
   * check the customer's previous orders and create
   * the latest delivery address as Home.
   */
  useEffect(() => {
    if (!user?.id) return;

    const loadAddresses = async () => {
      const storageKey =
        `cloudKitchenAddresses_${user.id}`;

      try {
        const stored =
          JSON.parse(
            localStorage.getItem(storageKey)
          ) || [];

        if (stored.length > 0) {
          setSavedAddresses(stored);
          setSelectedAddressId(stored[0].id);
          setShowAddressForm(false);
          return;
        }

        /*
         * No locally saved address.
         * Try previous orders.
         */
        try {
          const response = await axios.get(
            `${API}/orders/user/${user.id}`
          );

          const previousOrders =
            response.data || [];

          if (previousOrders.length > 0) {
            const latestOrder =
              previousOrders[0];

            if (
              latestOrder.houseNumber &&
              latestOrder.pincode
            ) {
              const homeAddress = {
                id: `home_${user.id}`,

                label: "Home",

                houseNumber:
                  latestOrder.houseNumber || "",

                street:
                  latestOrder.street || "",

                area:
                  latestOrder.area || "",

                village:
                  latestOrder.village || "",

                district:
                  latestOrder.district || "",

                pincode:
                  latestOrder.pincode || "",

                landmark:
                  latestOrder.landmark || "",

                latitude:
                  latestOrder.latitude,

                longitude:
                  latestOrder.longitude,

                accuracy:
                  latestOrder.locationAccuracy ||
                  0,
              };

              localStorage.setItem(
                storageKey,
                JSON.stringify([
                  homeAddress,
                ])
              );

              setSavedAddresses([
                homeAddress,
              ]);

              setSelectedAddressId(
                homeAddress.id
              );

              setShowAddressForm(false);

              return;
            }
          }
        } catch (previousOrderError) {
          console.log(
            "No previous address found.",
            previousOrderError
          );
        }

        /*
         * No previous address.
         * Show the first-time address form.
         */
        setSavedAddresses([]);
        setSelectedAddressId(null);
        setShowAddressForm(true);

      } catch (storageError) {
        console.error(
          "Failed to load saved addresses:",
          storageError
        );

        setSavedAddresses([]);
        setShowAddressForm(true);
      }
    };

    loadAddresses();
  }, [user]);

  const selectedAddress = useMemo(() => {
    return savedAddresses.find(
      (address) =>
        address.id === selectedAddressId
    );
  }, [
    savedAddresses,
    selectedAddressId,
  ]);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const deliveryFee = 40;
  const taxAmount = 10;
  const total =
    subtotal + deliveryFee + taxAmount;

  const handleAddressChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setAddressForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const shareLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,
        });

        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);

        setError(
          "Please allow location access to continue."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const createNewAddressObject = () => {
    return {
      id: `address_${Date.now()}`,

      label:
        savedAddresses.length === 0
          ? "Home"
          : `Address ${savedAddresses.length + 1}`,

      ...addressForm,

      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    };
  };

  const validateAddressForm = () => {
    const requiredFields = [
      "houseNumber",
      "street",
      "area",
      "village",
      "district",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (!addressForm[field].trim()) {
        setError(
          "Please fill all required address details."
        );
        return false;
      }
    }

    if (
      !/^\d{6}$/.test(
        addressForm.pincode
      )
    ) {
      setError(
        "Please enter a valid 6-digit PIN code."
      );
      return false;
    }

    if (
      location.latitude === null ||
      location.longitude === null
    ) {
      setError(
        "Please share your current location for this new address."
      );
      return false;
    }

    return true;
  };

  const saveAddress = () => {
    setError("");

    if (!validateAddressForm()) {
      return;
    }

    const newAddress =
      createNewAddressObject();

    const updatedAddresses = [
      ...savedAddresses,
      newAddress,
    ];

    setSavedAddresses(
      updatedAddresses
    );

    localStorage.setItem(
      `cloudKitchenAddresses_${user.id}`,
      JSON.stringify(updatedAddresses)
    );

    setSelectedAddressId(
      newAddress.id
    );

    setShowAddressForm(false);

    setError("");
  };

  const startNewAddress = () => {
    setSelectedAddressId(null);

    setAddressForm({
      houseNumber: "",
      street: "",
      area: "",
      village: "",
      district: "",
      pincode: "",
      landmark: "",
    });

    setLocation({
      latitude: null,
      longitude: null,
      accuracy: null,
    });

    setError("");
    setShowAddressForm(true);
  };

  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setShowAddressForm(false);
    setError("");
  };

  const placeOrder = async () => {
    setError("");

    if (!user?.id) {
      setError(
        "Please login before placing an order."
      );
      return;
    }

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    let addressToUse =
      selectedAddress;

    /*
     * If the customer is entering a new address,
     * validate and save it automatically.
     */
    if (showAddressForm) {
      if (!validateAddressForm()) {
        return;
      }

      const newAddress =
        createNewAddressObject();

      const updatedAddresses = [
        ...savedAddresses,
        newAddress,
      ];

      setSavedAddresses(
        updatedAddresses
      );

      localStorage.setItem(
        `cloudKitchenAddresses_${user.id}`,
        JSON.stringify(updatedAddresses)
      );

      addressToUse = newAddress;

      setSelectedAddressId(
        newAddress.id
      );

      setShowAddressForm(false);
    }

    if (!addressToUse) {
      setError(
        "Please select a delivery address."
      );
      return;
    }

    /*
     * Existing saved addresses already contain
     * their location. No need to ask for location
     * again.
     */
    if (
      addressToUse.latitude === null ||
      addressToUse.longitude === null
    ) {
      setError(
        "This address does not have a saved location. Please add the address again."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const items = cart.map((item) => ({
        foodId: item.id,
        quantity: item.quantity,
      }));

      const params =
        new URLSearchParams();

      params.append(
        "userId",
        String(user.id)
      );

      params.append(
        "paymentMethod",
        paymentMethod
      );

      params.append(
        "paymentStatus",
        paymentMethod === "UPI"
          ? "PAID"
          : "PENDING"
      );

      params.append(
        "houseNumber",
        addressToUse.houseNumber
      );

      params.append(
        "street",
        addressToUse.street
      );

      params.append(
        "area",
        addressToUse.area
      );

      params.append(
        "village",
        addressToUse.village
      );

      params.append(
        "district",
        addressToUse.district
      );

      params.append(
        "pincode",
        addressToUse.pincode
      );

      params.append(
        "landmark",
        addressToUse.landmark || ""
      );

      params.append(
        "latitude",
        String(addressToUse.latitude)
      );

      params.append(
        "longitude",
        String(addressToUse.longitude)
      );

      params.append(
        "locationAccuracy",
        String(
          addressToUse.accuracy || 0
        )
      );

      await axios.post(
        `${API}/orders?${params.toString()}`,
        items
      );

      clearCart();

      navigate("/orders");

    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data
          ?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Please Login</h2>

          <p>
            Login to continue with checkout.
          </p>

          <button
            onClick={() => navigate("/")}
            className="checkout-primary-button"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Your Cart is Empty</h2>

          <p>
            Add some delicious food before
            checkout.
          </p>

          <button
            onClick={() => navigate("/menu")}
            className="checkout-primary-button"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        <div className="checkout-main">

          <div className="checkout-heading">
            <span>
              CLOUDKITCHEN
            </span>

            <h1>
              Complete Your Order
            </h1>

            <p>
              Select your delivery address
              and choose your payment method.
            </p>
          </div>

          {/* SAVED ADDRESSES */}

          {savedAddresses.length > 0 && (
            <section className="checkout-card">

              <div className="checkout-card-heading">

                <div>
                  <h2>
                    📍 Delivery Address
                  </h2>

                  <p>
                    Select a saved address
                    for this order.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-address-button"
                  onClick={
                    startNewAddress
                  }
                >
                  + Add New Address
                </button>

              </div>

              <div className="saved-addresses">

                {savedAddresses.map(
                  (address) => (
                    <button
                      type="button"
                      key={address.id}
                      className={
                        selectedAddressId ===
                        address.id
                          ? "saved-address selected"
                          : "saved-address"
                      }
                      onClick={() =>
                        selectAddress(
                          address
                        )
                      }
                    >

                      <div className="saved-address-top">

                        <span className="home-icon">
                          {address.label ===
                          "Home"
                            ? "🏠"
                            : "📍"}
                        </span>

                        <span className="address-label">
                          {address.label}
                        </span>

                        {selectedAddressId ===
                          address.id && (
                          <span className="selected-check">
                            ✓
                          </span>
                        )}

                      </div>

                      <p>
                        {address.houseNumber},{" "}
                        {address.street},{" "}
                        {address.area}
                      </p>

                      <p>
                        {address.village},{" "}
                        {address.district} -{" "}
                        {address.pincode}
                      </p>

                      {address.landmark && (
                        <small>
                          Landmark:{" "}
                          {address.landmark}
                        </small>
                      )}

                      {selectedAddressId ===
                        address.id && (
                        <div className="selected-address-note">
                          ✓ Deliver to this address
                        </div>
                      )}

                    </button>
                  )
                )}

              </div>

            </section>
          )}

          {/* NEW ADDRESS */}

          {showAddressForm && (
            <section className="checkout-card">

              <div className="checkout-card-heading">

                <div>
                  <h2>
                    {savedAddresses.length > 0
                      ? "➕ Add New Address"
                      : "🏠 Add Your Home Address"}
                  </h2>

                  <p>
                    {savedAddresses.length > 0
                      ? "Enter details only when you want to deliver somewhere new."
                      : "This address will be saved as your Home address."}
                  </p>
                </div>

                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    className="back-address-button"
                    onClick={() => {
                      setShowAddressForm(
                        false
                      );

                      setSelectedAddressId(
                        savedAddresses[0].id
                      );

                      setError("");
                    }}
                  >
                    ← Use Saved Address
                  </button>
                )}

              </div>

              <div className="address-form-grid">

                <div className="checkout-field">
                  <label>
                    House / Door Number *
                  </label>

                  <input
                    name="houseNumber"
                    value={
                      addressForm.houseNumber
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="e.g. 12-45"
                  />
                </div>

                <div className="checkout-field">
                  <label>
                    Street *
                  </label>

                  <input
                    name="street"
                    value={
                      addressForm.street
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Main Street"
                  />
                </div>

                <div className="checkout-field">
                  <label>
                    Area / Locality *
                  </label>

                  <input
                    name="area"
                    value={
                      addressForm.area
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Area name"
                  />
                </div>

                <div className="checkout-field">
                  <label>
                    Village / Town *
                  </label>

                  <input
                    name="village"
                    value={
                      addressForm.village
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Village / Town"
                  />
                </div>

                <div className="checkout-field">
                  <label>
                    District *
                  </label>

                  <input
                    name="district"
                    value={
                      addressForm.district
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="District"
                  />
                </div>

                <div className="checkout-field">
                  <label>
                    PIN Code *
                  </label>

                  <input
                    name="pincode"
                    value={
                      addressForm.pincode
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="6-digit PIN"
                    maxLength="6"
                    inputMode="numeric"
                  />
                </div>

                <div className="checkout-field full-width">
                  <label>
                    Landmark
                  </label>

                  <input
                    name="landmark"
                    value={
                      addressForm.landmark
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Nearby landmark"
                  />
                </div>

              </div>

              <div className="location-box">

                <div>
                  <strong>
                    📍 Delivery Location
                  </strong>

                  <p>
                    Share your location once
                    for this address.
                  </p>
                </div>

                <button
                  type="button"
                  className={
                    location.latitude !== null
                      ? "location-button location-success"
                      : "location-button"
                  }
                  onClick={shareLocation}
                  disabled={
                    locationLoading
                  }
                >
                  {locationLoading
                    ? "Getting Location..."
                    : location.latitude !== null
                      ? "✓ Location Shared"
                      : "Share Current Location"}
                </button>

              </div>

              {savedAddresses.length ===
                0 && (
                <div className="home-save-note">
                  🏠 This address will be
                  automatically saved as{" "}
                  <strong>Home</strong>.
                </div>
              )}

              {savedAddresses.length >
                0 && (
                <button
                  type="button"
                  className="save-address-button"
                  onClick={saveAddress}
                >
                  Save This Address
                </button>
              )}

            </section>
          )}

          {/* PAYMENT */}

          <section className="checkout-card">

            <div className="checkout-card-heading">
              <div>
                <h2>
                  💳 Payment Method
                </h2>

                <p>
                  Choose how you want to pay.
                </p>
              </div>
            </div>

            <div className="payment-options">

              <button
                type="button"
                className={
                  paymentMethod === "COD"
                    ? "payment-option selected"
                    : "payment-option"
                }
                onClick={() =>
                  setPaymentMethod("COD")
                }
              >
                <span>💵</span>

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <small>
                    Pay when your order arrives
                  </small>
                </div>

                {paymentMethod ===
                  "COD" && (
                  <b>✓</b>
                )}
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "UPI"
                    ? "payment-option selected"
                    : "payment-option"
                }
                onClick={() =>
                  setPaymentMethod("UPI")
                }
              >
                <span>📱</span>

                <div>
                  <strong>
                    UPI
                  </strong>

                  <small>
                    Demo payment for project
                  </small>
                </div>

                {paymentMethod ===
                  "UPI" && (
                  <b>✓</b>
                )}
              </button>

            </div>

          </section>

          {error && (
            <div className="checkout-error">
              ⚠️ {error}
            </div>
          )}

        </div>

        {/* ORDER SUMMARY */}

        <aside className="checkout-summary">

          <div className="summary-heading">
            <h2>
              Your Order
            </h2>

            <span>
              {cart.length} item
              {cart.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          <div className="summary-items">

            {cart.map((item) => (
              <div
                className="summary-item"
                key={item.id}
              >

                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.quantity} × ₹
                    {Number(
                      item.price || 0
                    ).toFixed(0)}
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
                  ).toFixed(0)}
                </strong>

              </div>
            ))}

          </div>

          <div className="summary-calculation">

            <div>
              <span>Subtotal</span>

              <strong>
                ₹{subtotal.toFixed(0)}
              </strong>
            </div>

            <div>
              <span>Delivery Fee</span>

              <strong>
                ₹{deliveryFee}
              </strong>
            </div>

            <div>
              <span>GST</span>

              <strong>
                ₹{taxAmount}
              </strong>
            </div>

            <div className="summary-total">
              <span>
                Grand Total
              </span>

              <strong>
                ₹{total.toFixed(0)}
              </strong>
            </div>

          </div>

          <button
            className="place-order-button"
            onClick={placeOrder}
            disabled={placingOrder}
          >
            {placingOrder
              ? "Placing Order..."
              : `Place Order • ₹${total.toFixed(0)}`}
          </button>

          <p className="secure-note">
            🔒 Your order details are securely
            processed.
          </p>

        </aside>

      </div>
    </div>
  );
}

export default Checkout;