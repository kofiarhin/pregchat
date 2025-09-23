import React from "react";
import { Link } from "react-router-dom";
import styles from "./cart.styles.module.scss";
import content from "../../content/appContent.json";
import { useCart } from "../../context/CartContext.jsx";

const Cart = () => {
  const { cart, updateQuantity, removeItem, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className={styles.page}>
        <h1>{content.cart.title}</h1>
        <p className={styles.empty}>{content.cart.empty}</p>
        <Link to="/store" className={styles.primaryLink}>
          {content.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>{content.cart.title}</h1>
      <div className={styles.list}>
        {cart.map(({ item, quantity }) => {
          const increase = () => updateQuantity(item._id, quantity + 1);
          const decrease = () => updateQuantity(item._id, quantity - 1);

          return (
            <article key={item._id} className={styles.row}>
              <div className={styles.imageWrapper}>
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className={styles.details}>
                <h2>{item.name}</h2>
                <p className={styles.price}>${item.price?.toFixed(2)}</p>
                <div className={styles.controls}>
                  <span>{content.cart.quantity}</span>
                  <div className={styles.buttons}>
                    <button type="button" onClick={decrease} disabled={quantity <= 1}>
                      –
                    </button>
                    <span className={styles.count}>{quantity}</span>
                    <button
                      type="button"
                      onClick={increase}
                      disabled={quantity >= (item.stock ?? Infinity)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeItem(item._id)}
                >
                  {content.cart.remove}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.summary}>
        <div>
          <span>{content.cart.subtotal}</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <Link to="/checkout" className={styles.checkoutButton}>
          {content.cart.checkout}
        </Link>
      </div>
    </div>
  );
};

export default Cart;
