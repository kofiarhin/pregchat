import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./checkout.styles.module.scss";
import content from "../../content/appContent.json";
import { useCart } from "../../context/CartContext.jsx";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    address: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedItems, setSubmittedItems] = useState([]);

  const hasCartItems = cart.length > 0;

  const currentSummary = useMemo(() => {
    if (submitted) {
      return submittedItems;
    }

    return cart;
  }, [submitted, submittedItems, cart]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      return;
    }

    setSubmittedItems(cart.map((entry) => ({ ...entry })));
    clearCart();
    setSubmitted(true);
  };

  if (!hasCartItems && !submitted) {
    return (
      <div className={styles.page}>
        <h1>{content.checkout.title}</h1>
        <p className={styles.feedback}>{content.checkout.empty}</p>
        <Link to="/store" className={styles.primaryLink}>
          {content.checkout.backToStore}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>{content.checkout.title}</h1>
      <div className={styles.layout}>
        <section className={styles.summary}>
          <h2>{content.checkout.summaryHeading}</h2>
          {currentSummary.length === 0 ? (
            <p className={styles.feedback}>{content.checkout.empty}</p>
          ) : (
            <ul>
              {currentSummary.map(({ item, quantity }) => (
                <li key={item._id}>
                  <div>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemMeta}>× {quantity}</span>
                  </div>
                  <span className={styles.itemPrice}>
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.totalRow}>
            <span>{content.cart.subtotal}</span>
            <span>
              ${submitted
                ? submittedItems
                    .reduce(
                      (total, entry) =>
                        total + entry.quantity * (entry.item.price ?? 0),
                      0
                    )
                    .toFixed(2)
                : cartTotal.toFixed(2)}
            </span>
          </div>
        </section>
        <section className={styles.formSection}>
          <h2>{content.checkout.formHeading}</h2>
          {submitted ? (
            <div className={styles.success}>{content.checkout.success}</div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>
                {content.checkout.nameLabel}
                <input
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                {content.checkout.emailLabel}
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                {content.checkout.addressLabel}
                <textarea
                  name="address"
                  value={formState.address}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </label>
              <button type="submit" className={styles.submitButton}>
                {content.checkout.confirm}
              </button>
            </form>
          )}
          {submitted && (
            <Link to="/store" className={styles.secondaryLink}>
              {content.checkout.backToStore}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
};

export default Checkout;
