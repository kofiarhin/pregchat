import React from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./itemDetails.styles.module.scss";
import content from "../../content/appContent.json";
import { useStoreItemQuery } from "../../features/store/hooks/useStoreQueries.js";
import { useCart } from "../../context/CartContext.jsx";

const ItemDetails = () => {
  const { id } = useParams();
  const { data: item, isLoading, error } = useStoreItemQuery({ id });
  const { addItem, isInCart } = useCart();

  const handleAddToCart = () => {
    if (item) {
      addItem(item, 1);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.feedback}>{content.itemDetails.loading}</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.page}>
        <div className={styles.feedback}>{content.itemDetails.error}</div>
        <Link to="/store" className={styles.backLink}>
          {content.itemDetails.backLink}
        </Link>
      </div>
    );
  }

  const isOutOfStock = (item.stock ?? 0) === 0;
  const alreadyInCart = isInCart(item._id);

  return (
    <div className={styles.page}>
      <Link to="/store" className={styles.backLink}>
        {content.itemDetails.backLink}
      </Link>
      <div className={styles.layout}>
        <div className={styles.imageWrapper}>
          <img src={item.image} alt={item.name} loading="lazy" />
        </div>
        <div className={styles.details}>
          <h1>{item.name}</h1>
          <p className={styles.description}>{item.description}</p>
          <p className={styles.price}>
            <span>{content.itemDetails.priceLabel}:</span> ${item.price?.toFixed(2)}
          </p>
          <p className={styles.stock}>
            <span>{content.itemDetails.stockLabel}:</span>{" "}
            {isOutOfStock
              ? content.itemDetails.outOfStock
              : item.stock}
          </p>
          <button
            type="button"
            className={styles.addButton}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {alreadyInCart
              ? content.itemDetails.addAnother
              : content.itemDetails.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
