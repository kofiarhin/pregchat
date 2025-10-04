import React from "react";
import { Link } from "react-router-dom";
import styles from "./store.styles.module.scss";
import content from "../../content/appContent.json";
import { useStoreItemsQuery } from "../../features/store/hooks/useStoreQueries.js";
import { useCart } from "../../context/CartContext.jsx";

const Store = () => {
  const { data: items = [], isLoading, error } = useStoreItemsQuery();
  const { addItem, isInCart } = useCart();

  const handleAddToCart = (item) => () => {
    addItem(item, 1);
  };

  if (isLoading) {
    return (
      <div className={styles.storePage}>
        <div className={styles.header}>
          <h1>{content.store.title}</h1>
          <p>{content.store.subtitle}</p>
        </div>
        <div className={styles.feedback}>{content.store.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.storePage}>
        <div className={styles.header}>
          <h1>{content.store.title}</h1>
          <p>{content.store.subtitle}</p>
        </div>
        <div className={styles.feedback}>
          {error.message || content.store.error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.storePage}>
      <div className={styles.header}>
        <h1>{content.store.title}</h1>
        <p>{content.store.subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className={styles.feedback}>{content.store.empty}</div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => {
            const isOutOfStock = (item.stock ?? 0) === 0;
            const alreadyInCart = isInCart(item._id);

            return (
              <article key={item._id} className={styles.card}>
                <Link to={`/store/${item._id}`} className={styles.imageWrapper}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                </Link>
                <div className={styles.content}>
                  <h2>{item.name}</h2>
                  <p className={styles.price}>${item.price?.toFixed(2)}</p>
                  <div className={styles.actions}>
                    <Link to={`/store/${item._id}`} className={styles.link}>
                      {content.store.detailsLinkLabel}
                    </Link>
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={handleAddToCart(item)}
                      disabled={isOutOfStock}
                    >
                      {alreadyInCart
                        ? content.store.addMore
                        : content.store.addToCart}
                    </button>
                  </div>
                  {isOutOfStock && (
                    <p className={styles.stockWarning}>
                      {content.store.outOfStock}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Store;
