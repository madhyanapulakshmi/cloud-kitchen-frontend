import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";
import "./Auth.css";

const API = "http://localhost:8081/api";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);

  const [user, setUser] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("cloudKitchenUser")
        ) || null
      );
    } catch {
      return null;
    }
  });

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ========================================
  // LOAD FOODS
  // ========================================

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const response = await axios.get(
        `${API}/foods`
      );

      setFoods(response.data);
    } catch (error) {
      console.error(
        "Failed to load foods:",
        error
      );
    }
  };

  // ========================================
  // CART
  // ========================================

  const addToCart = (food) => {
    if (food.available === false) {
      return;
    }

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) => item.id === food.id
        );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === food.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...food,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (foodId) => {
    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) => item.id === foodId
        );

      if (!existingItem) {
        return currentCart;
      }

      if (existingItem.quantity <= 1) {
        return currentCart.filter(
          (item) => item.id !== foodId
        );
      }

      return currentCart.map((item) =>
        item.id === foodId
          ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ========================================
  // AUTH
  // ========================================

  const openLogin = () => {
    setAuthMode("login");
    setAuthError("");

    setAuthForm({
      name: "",
      email: "",
      password: "",
    });

    setShowAuth(true);
  };

  const openRegister = () => {
    setAuthMode("register");
    setAuthError("");

    setAuthForm({
      name: "",
      email: "",
      password: "",
    });

    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
    setAuthError("");
  };

  const handleAuthChange = (event) => {
    const { name, value } =
      event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ========================================
  // LOGIN / REGISTER
  // ========================================

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      // REGISTER
      if (authMode === "register") {
        const response =
          await axios.post(
            `${API}/auth/register`,
            {
              name: authForm.name,
              email: authForm.email,
              password:
                authForm.password,
              role: "CUSTOMER",
            }
          );

        const registeredUser =
          response.data;

        localStorage.setItem(
          "cloudKitchenUser",
          JSON.stringify(
            registeredUser
          )
        );

        setUser(registeredUser);
        setShowAuth(false);

        navigate("/");
      }

      // LOGIN
      else {
        const response =
          await axios.post(
            `${API}/auth/login`,
            {
              email: authForm.email,
              password:
                authForm.password,
            }
          );

        const loggedUser =
          response.data;

        localStorage.setItem(
          "cloudKitchenUser",
          JSON.stringify(
            loggedUser
          )
        );

        setUser(loggedUser);
        setShowAuth(false);

        if (
          loggedUser.role ===
          "ADMIN"
        ) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error(error);

      setAuthError(
        error.response?.data
          ?.message ||
          "Authentication failed. Please check your details."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = () => {
    localStorage.removeItem(
      "cloudKitchenUser"
    );

    setUser(null);
    setCart([]);

    navigate("/");
  };

  const isAdmin =
    user?.role === "ADMIN";

  // ========================================
  // NAVBAR
  // ========================================

  return (
    <div className="app">

      <header className="navbar">

        {/* LOGO */}

        <Link
          to="/"
          className="logo"
        >
          🍴 CloudKitchen
        </Link>

        {/* NAVIGATION */}

        <nav className="nav-links">

          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "active"
                : ""
            }
          >
            Home
          </Link>

          <Link
            to="/menu"
            className={
              location.pathname ===
              "/menu"
                ? "active"
                : ""
            }
          >
            Menu
          </Link>

          {user && (
            <Link
              to="/orders"
              className={
                location.pathname ===
                "/orders"
                  ? "active"
                  : ""
              }
            >
              Orders
            </Link>
          )}

          {user && (
            <Link
              to="/profile"
              className={
                location.pathname ===
                "/profile"
                  ? "active"
                  : ""
              }
            >
              Profile
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={
                location.pathname ===
                "/admin"
                  ? "active"
                  : ""
              }
            >
              Admin
            </Link>
          )}

        </nav>

        {/* NAV ACTIONS */}

        <div className="nav-actions">

          {!user ? (
            <>
              <button
                type="button"
                className="login-nav-button"
                onClick={openLogin}
              >
                Login
              </button>

              <button
                type="button"
                className="register-nav-button"
                onClick={openRegister}
              >
                Register
              </button>
            </>
          ) : (
            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>
          )}

          <Link
            to="/cart"
            className="cart-button"
          >
            🛒 Cart ({cartCount})
          </Link>

        </div>

      </header>

      {/* APPLICATION ROUTES */}

      <main>

        <Routes>

          {/* HOME */}

          <Route
            path="/"
            element={
              <Home
                foods={foods}
                cart={cart}
                addToCart={addToCart}
                removeFromCart={
                  removeFromCart
                }
              />
            }
          />

          {/* MENU */}

          <Route
            path="/menu"
            element={
              <Menu
                foods={foods}
                cart={cart}
                addToCart={addToCart}
                removeFromCart={
                  removeFromCart
                }
              />
            }
          />

          {/* CART */}

          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                addToCart={addToCart}
                removeFromCart={
                  removeFromCart
                }
              />
            }
          />

          {/* CHECKOUT */}

          <Route
            path="/checkout"
            element={
              <Checkout
                user={user}
                cart={cart}
                clearCart={clearCart}
              />
            }
          />

          {/* ORDERS */}

          <Route
            path="/orders"
            element={
              <Orders
                user={user}
              />
            }
          />

          {/* PROFILE */}

          <Route
            path="/profile"
            element={
              <Profile
                user={user}
              />
            }
          />

          {/* ADMIN */}

          <Route
            path="/admin"
            element={
              <AdminDashboard />
            }
          />

        </Routes>

      </main>

      {/* LOGIN / REGISTER MODAL */}

      {showAuth && (

        <div
          className="auth-overlay"
          onClick={closeAuth}
        >

          <div
            className="auth-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="auth-close"
              onClick={closeAuth}
            >
              ×
            </button>

            {/* HEADER */}

            <div className="auth-header">

              <div className="auth-icon">
                🍴
              </div>

              <h2>
                {authMode ===
                "login"
                  ? "Welcome Back"
                  : "Create Account"}
              </h2>

              <p>
                {authMode ===
                "login"
                  ? "Login to continue ordering delicious food."
                  : "Create your CloudKitchen customer account."}
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleAuthSubmit
              }
            >

              {/* NAME */}

              {authMode ===
                "register" && (

                <div className="form-group">

                  <label htmlFor="name">
                    Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={
                      authForm.name
                    }
                    onChange={
                      handleAuthChange
                    }
                    required
                  />

                </div>

              )}

              {/* EMAIL */}

              <div className="form-group">

                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={
                    authForm.email
                  }
                  onChange={
                    handleAuthChange
                  }
                  required
                />

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={
                    authForm.password
                  }
                  onChange={
                    handleAuthChange
                  }
                  required
                />

              </div>

              {/* ERROR */}

              {authError && (
                <div className="auth-error">
                  {authError}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  authLoading
                }
              >
                {authLoading
                  ? "Please wait..."
                  : authMode ===
                    "login"
                    ? "Login"
                    : "Create Account"}
              </button>

            </form>

            {/* SWITCH */}

            <div className="auth-switch">

              {authMode ===
              "login" ? (
                <>
                  <span>
                    Don't have an
                    account?
                  </span>

                  <button
                    type="button"
                    onClick={
                      openRegister
                    }
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Already have an
                    account?
                  </span>

                  <button
                    type="button"
                    onClick={
                      openLogin
                    }
                  >
                    Login
                  </button>
                </>
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ========================================
// ROOT APP
// ========================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;