import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Utensils,
  MapPin,
  Search,
  Plus,
  Minus,
  X,
  Star,
  Clock,
  Check,
  Trash2,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { products, portions, money } from "./data";
import { addItem, cartTotal } from "./cart";
import "./styles.css";

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function App() {
  const [screen, setScreen] = useState("signup");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [portion, setPortion] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState(() => {
    const saved = readSaved("fastor-cart", []);
    return Array.isArray(saved)
      ? saved.filter(
          (i) =>
            typeof i.key === "string" &&
            Number.isFinite(i.price) &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0,
        )
      : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState("");
  const [ordered, setOrdered] = useState(false);
  const otpRef = useRef(null);
  const count = cart.reduce((n, item) => n + item.quantity, 0);
  useEffect(() => {
    try {
      localStorage.setItem("fastor-cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);
  useEffect(() => {
    if (screen !== "verify" || seconds === 0) return;
    const t = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, seconds]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!selected && !showCart) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setShowCart(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, showCart]);
  function getOtp(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone))
      return setError("Enter a valid 10-digit Indian mobile number.");
    setError("");
    setOtp("");
    setSeconds(30);
    setScreen("verify");
  }
  function verify(e) {
    e.preventDefault();
    if (otp !== "123456")
      return setError("Use the demo code 123456 to continue.");
    setError("");
    setScreen("home");
  }
  function openProduct(product) {
    setSelected(product);
    setPortion(0);
    setQuantity(1);
  }
  function addToCart() {
    const choice =
      selected.category === "Pizza"
        ? portions[portion]
        : { label: "Regular", extra: 0 };
    setCart(addItem(cart, selected, choice, quantity));
    setToast(`${selected.name} added to your cart`);
    setSelected(null);
  }
  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className="brand-panel">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setScreen("signup");
          }}
        >
          <span className="brand-icon">
            <Utensils size={22} />
          </span>
          fastor<span className="brand-dot">.</span>
        </a>
        <div className="brand-story">
          <span className="eyebrow">A LITTLE CRAVING. A GREAT DISCOVERY.</span>
          <h1>
            Good food.
            <br />
            Great moments.
            <br />
            <em>Right here.</em>
          </h1>
          <p>
            Your neighbourhood favourites,
            <br />
            just a few taps away.
          </p>
          <div className="hero-food">
            <img src="/assets/pizza.jpg" alt="Freshly baked margherita pizza" />
            <span className="food-sticker">
              <Star size={16} fill="currentColor" /> Made for your cravings
            </span>
          </div>
        </div>
        <span className="brand-footer">Fresh finds. Happy bites.</span>
      </aside>
      <main
        className={`main-panel ${screen === "home" ? "catalogue-panel" : ""}`}
      >
        {screen !== "home" ? (
          <section className="auth-screen">
            <div className="mobile-brand">
              <span className="brand-icon">
                <Utensils size={18} />
              </span>
              fastor.
            </div>
            <button
              className="back-button"
              aria-label={
                screen === "verify" ? "Back to phone number" : "Browse menu"
              }
              onClick={() => {
                setScreen(screen === "verify" ? "signup" : "home");
                setError("");
              }}
            >
              <ArrowLeft size={21} />
            </button>
            <div className="auth-intro">
              <span className="step-label">LET’S GET YOU STARTED</span>
              <h2>
                {screen === "signup" ? "Sign Up to Fastor" : "6-digit code"}
              </h2>
              <p>
                {screen === "signup" ? (
                  "Let us know your mobile number and we will send you an OTP for verification."
                ) : (
                  <>
                    Please enter the code we’ve sent to
                    <br />
                    <strong>
                      +91 {phone.slice(0, 5)} {phone.slice(5)}
                    </strong>
                  </>
                )}
              </p>
            </div>
            <form onSubmit={screen === "signup" ? getOtp : verify}>
              {screen === "signup" ? (
                <label className="phone-input">
                  <span>+91</span>
                  <input
                    aria-label="Mobile number"
                    autoComplete="tel-national"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                  />
                </label>
              ) : (
                <>
                  <div
                    className="otp-wrap"
                    onClick={() => otpRef.current?.focus()}
                  >
                    <input
                      ref={otpRef}
                      aria-label="Six digit verification code"
                      className="otp-real"
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                    />
                    <div className="otp-boxes" aria-hidden="true">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span
                          className={i === otp.length ? "active" : ""}
                          key={i}
                        >
                          {otp[i]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="resend">
                    I didn’t receive a code{" "}
                    {seconds ? (
                      <span>({`00:${String(seconds).padStart(2, "0")}`})</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSeconds(30);
                          setOtp("");
                          setToast("Demo code is 123456");
                        }}
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                  <div className="demo-note">
                    Demo verification · Use <strong>123456</strong>
                    <br />
                    No SMS is sent.
                  </div>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="auth-bottom">
                <button className="primary" type="submit">
                  {screen === "signup" ? "Get OTP" : "Continue"}
                  <ArrowRight size={17} />
                </button>
                <p className="fine-print">
                  {screen === "signup"
                    ? "A frontend demonstration. No phone number is sent or stored."
                    : "Your next favourite meal is waiting."}
                </p>
                {screen === "signup" && (
                  <button
                    className="skip"
                    type="button"
                    onClick={() => setScreen("home")}
                  >
                    Just looking? Explore the menu
                  </button>
                )}
              </div>
            </form>
            <div className="home-indicator" />
          </section>
        ) : (
          <section className="home-screen">
            <header className="home-header">
              <div>
                <span className="muted small">Current Location</span>
                <p>
                  <MapPin size={14} /> Model Town, New Delhi{" "}
                  <ChevronDown size={13} />
                </p>
              </div>
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={() => {
                  setScreen("signup");
                  setPhone("");
                  setOtp("");
                }}
              >
                <LogOut size={18} />
              </button>
            </header>
            <div className="greeting">
              <div>
                <span className="muted">Hello, foodie 👋</span>
                <h2>What are you craving?</h2>
              </div>
              <button
                className="bag-button"
                aria-label={`Open cart, ${count} items`}
                onClick={() => {
                  setOrdered(false);
                  setShowCart(true);
                }}
              >
                <ShoppingBag size={22} />
                {count > 0 && <b>{count}</b>}
              </button>
            </div>
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search food"
                placeholder="Find your favourite food"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={16} />
                </button>
              )}
            </label>
            <div className="section-heading">
              <h3>Best Seller</h3>
              <span>THE CROWD FAVOURITES</span>
            </div>
            <div className="best-sellers">
              {products.map((p) => (
                <button
                  className="best-card"
                  key={p.id}
                  onClick={() => openProduct(p)}
                >
                  <img src={p.image} alt={p.name} />
                  <span>{p.name}</span>
                  <b>{money(p.price)}</b>
                </button>
              ))}
            </div>
            <button className="promo" onClick={() => openProduct(products[0])}>
              <div>
                <span>
                  Experience our
                  <br />
                  delicious new dish
                </span>
                <strong>30% OFF</strong>
                <small>On your first pizza · demo offer</small>
              </div>
              <img src="/assets/pizza.jpg" alt="Margherita pizza" />
              <span className="promo-arrow">
                <ArrowRight size={19} />
              </span>
            </button>
            <div className="section-heading popular-heading">
              <h3>Popular Items</h3>
              <span>FRESHLY PICKED FOR YOU</span>
            </div>
            <div className="categories" aria-label="Food categories">
              {["All", "Pizza", "Burgers", "Drinks", "Bowls"].map((c) => (
                <button
                  aria-pressed={category === c}
                  className={category === c ? "selected" : ""}
                  key={c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="product-list">
              {filtered.map((p) => (
                <button
                  className="product-row"
                  key={p.id}
                  onClick={() => openProduct(p)}
                >
                  <img src={p.image} alt={p.name} />
                  <div>
                    <span className="product-tag">{p.tag}</span>
                    <h4>{p.name}</h4>
                    <p>
                      <Star size={12} fill="currentColor" /> {p.rating}
                      <span>·</span>
                      <Clock size={12} /> {p.time}
                    </p>
                  </div>
                  <div className="product-price">
                    <strong>{money(p.price)}</strong>
                    <span className="add-small">
                      <Plus size={15} />
                    </span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="empty">
                  <Search />
                  <h3>No dishes found</h3>
                  <p>Try another search or category.</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                    }}
                  >
                    Show all dishes
                  </button>
                </div>
              )}
            </div>
            {count > 0 && (
              <button
                className="cart-bar"
                onClick={() => {
                  setOrdered(false);
                  setShowCart(true);
                }}
              >
                <span>
                  {count} {count === 1 ? "item" : "items"} ·{" "}
                  {money(cartTotal(cart))}
                </span>
                <strong>
                  View cart <ArrowRight size={16} />
                </strong>
              </button>
            )}
            <footer className="menu-footer">
              Made with good taste. <span>fastor.</span>
            </footer>
          </section>
        )}
      </main>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="detail">
            <div className="detail-image">
              <img src={selected.image} alt={selected.name} />
              <span>
                <Star size={13} fill="currentColor" /> {selected.rating} ·{" "}
                {selected.tag}
              </span>
            </div>
            <div className="price-quantity">
              <strong>
                {money(
                  selected.price +
                    (selected.category === "Pizza"
                      ? portions[portion].extra
                      : 0),
                )}
              </strong>
              <Quantity quantity={quantity} change={setQuantity} />
            </div>
            <h2>{selected.name}</h2>
            <p className="description">{selected.description}</p>
            <fieldset>
              <legend>
                {selected.category === "Pizza"
                  ? "Personal portion"
                  : "Choose your portion"}
              </legend>
              {(selected.category === "Pizza"
                ? portions
                : [{ label: "Regular", extra: 0 }]
              ).map((p, i) => (
                <label className="portion" key={p.label}>
                  <span>{p.label}</span>
                  <span>{money(p.extra)}</span>
                  <input
                    type="radio"
                    name="portion"
                    checked={portion === i}
                    onChange={() => setPortion(i)}
                  />
                </label>
              ))}
            </fieldset>
            <button className="primary detail-add" onClick={addToCart}>
              <span>Add to cart</span>
              <strong>
                {money(
                  (selected.price +
                    (selected.category === "Pizza"
                      ? portions[portion].extra
                      : 0)) *
                    quantity,
                )}
              </strong>
            </button>
          </div>
        </Modal>
      )}
      {showCart && (
        <Modal title="Your cart" onClose={() => setShowCart(false)}>
          {ordered ? (
            <div className="empty confirmation">
              <span className="success-icon">
                <Check />
              </span>
              <h2>You’ve got great taste!</h2>
              <p>
                Your demo order is complete. No payment was taken and no
                restaurant order was placed.
              </p>
              <button className="primary" onClick={() => setShowCart(false)}>
                Back to the menu
              </button>
            </div>
          ) : cart.length ? (
            <div className="cart-content">
              {cart.map((item) => (
                <div className="cart-item" key={item.key}>
                  <img src={item.image} alt="" />
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.portion}</p>
                    <strong>{money(item.price * item.quantity)}</strong>
                    <Quantity
                      quantity={item.quantity}
                      change={(n) =>
                        setCart(
                          cart.map((c) =>
                            c.key === item.key ? { ...c, quantity: n } : c,
                          ),
                        )
                      }
                    />
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setCart(cart.filter((c) => c.key !== item.key))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div className="total">
                <span>Total</span>
                <strong>{money(cartTotal(cart))}</strong>
              </div>
              <p className="fine-print">
                Demo checkout · No payment or delivery integration.
              </p>
              <button
                className="primary"
                onClick={() => {
                  setOrdered(true);
                  setCart([]);
                }}
              >
                Place demo order <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="empty">
              <ShoppingBag size={40} />
              <h2>A little empty in here</h2>
              <p>Let’s find you something delicious.</p>
              <button className="primary" onClick={() => setShowCart(false)}>
                Explore the menu
              </button>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Quantity({ quantity, change }) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
        onClick={() => change(quantity - 1)}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        aria-label="Increase quantity"
        disabled={quantity >= 99}
        onClick={() => change(quantity + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prior = document.activeElement;
    ref.current.showModal();
    return () => {
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="modal-header">
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <span>{title}</span>
        <span className="mini-brand">fastor.</span>
      </header>
      {children}
    </dialog>
  );
}
createRoot(document.getElementById("root")).render(<App />);
