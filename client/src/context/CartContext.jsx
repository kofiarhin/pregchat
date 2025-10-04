import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "pregchat:store:cart";

const loadCartFromStorage = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse stored cart", error);
    return [];
  }
};

const persistCartToStorage = (cart) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to persist cart", error);
  }
};

const cartReducer = (state, action) => {
  if (action.type === "ADD_ITEM") {
    const { item, quantity } = action.payload;
    const existing = state.find((entry) => entry.item._id === item._id);
    const nextQuantity = Math.min(item.stock ?? Infinity, quantity);

    if (nextQuantity <= 0) {
      return state;
    }

    if (existing) {
      return state.map((entry) => {
        if (entry.item._id !== item._id) {
          return entry;
        }

        const updatedQuantity = Math.min(
          item.stock ?? Infinity,
          entry.quantity + nextQuantity
        );

        if (updatedQuantity <= 0) {
          return entry;
        }

        return {
          ...entry,
          quantity: updatedQuantity,
        };
      });
    }

    return [
      ...state,
      {
        item,
        quantity: nextQuantity,
      },
    ];
  }

  if (action.type === "REMOVE_ITEM") {
    return state.filter((entry) => entry.item._id !== action.payload.id);
  }

  if (action.type === "UPDATE_QUANTITY") {
    const { id, quantity } = action.payload;

    return state.map((entry) => {
      if (entry.item._id !== id) {
        return entry;
      }

      const cappedQuantity = Math.max(
        1,
        Math.min(entry.item.stock ?? Infinity, quantity)
      );

      return {
        ...entry,
        quantity: cappedQuantity,
      };
    });
  }

  if (action.type === "CLEAR") {
    return [];
  }

  return state;
};

const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);

  useEffect(() => {
    persistCartToStorage(cart);
  }, [cart]);

  const addItem = (item, quantity = 1) => {
    if (!item) {
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      payload: { item, quantity },
    });
  };

  const removeItem = (id) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: { id },
    });
  };

  const updateQuantity = (id, quantity) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR" });
  };

  const value = useMemo(() => {
    const cartCount = cart.reduce((total, entry) => total + entry.quantity, 0);
    const cartTotal = cart.reduce(
      (total, entry) => total + entry.quantity * (entry.item.price ?? 0),
      0
    );

    const isInCart = (id) => cart.some((entry) => entry.item._id === id);

    return {
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isInCart,
    };
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};

export default CartProvider;
