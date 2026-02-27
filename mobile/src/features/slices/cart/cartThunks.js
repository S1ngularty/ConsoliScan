import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCart, getCart, syncCartApi } from "../../../api/cart.api";
import { confirmOrder } from "../../../api/order.api";

// ─── Save cart to local storage ─────────────────────────────────────────────
export const saveLocally = createAsyncThunk(
  "cart/saveLocally",
  async (_, { getState }) => {
    const { cart } = getState();

    if (cart.cart.length <= 0 && !cart.sessionActive) {
      await AsyncStorage.removeItem("cart");
      return;
    }

    const cartData = {
      items: cart.cart,
      itemCount: cart.itemCount,
      totalPrice: cart.totalPrice,
      sessionActive: cart.sessionActive,
      sessionId: cart.sessionId,
      sessionStartTime: cart.sessionStartTime,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem("cart", JSON.stringify(cartData));
  },
);

// ─── Load cart from local storage ─────────────────────────────────────────────
export const loadLocalCart = createAsyncThunk(
  "cart/loadLocalCart",
  async () => {
    const cartJson = await AsyncStorage.getItem("cart");
    if (!cartJson) {
      return null;
    }

    const cartData = JSON.parse(cartJson);

    return cartData;
  },
);

// ─── DEPRECATED: Cart sync to backend (not used in session-based cart) ───────
// This is kept for reference but not used in session-based shopping
/*
export const syncCartToServer = createAsyncThunk(
  "cart/syncCartToServer",
  async (_, { getState, dispatch }) => {
    const { cart, auth, network } = getState();

    // Always save locally first (ensures data safety)
    const { itemCount, totalPrice } = cart;
    await dispatch(
      saveLocally({
        items: cart.cart,
        itemCount,
        totalPrice,
      }),
    );

    // Check if user is logged in
    if (!auth.isLoggedIn) {
      return { synced: false, reason: "not_logged_in" };
    }

    // Check network status
    if (network.isOffline || network.isServerDown) {
      await AsyncStorage.setItem("cart_needs_sync", "true");
      return { synced: false, reason: "offline", needsSync: true };
    }

    // Empty cart check
    if (cart.cart.length <= 0) {
      return { synced: false, reason: "empty_cart" };
    }

    // Prepare data for server
    const formattedData = cart.cart.map((item) => ({
      product: item._id,
      qty: item.qty,
      dateAdded: item.dateAdded,
    }));

    const data = {
      items: formattedData,
      itemCount,
      totalPrice,
    };

    try {
      await syncCartApi(data);
      await AsyncStorage.removeItem("cart_needs_sync");
      return { synced: true, itemCount };
    } catch (error) {
      await AsyncStorage.setItem("cart_needs_sync", "true");
      throw error;
    }
  },
);
*/

// ─── DEPRECATED: Get cart from backend (not used in session-based cart) ───────
// This is kept for reference but not used in session-based shopping
/*
export const getCartFromServer = createAsyncThunk(
  "cart/getCartFromServer",
  async (_, { getState, dispatch }) => {
    const { auth, network } = getState();

    if (!auth.isLoggedIn) {
      return null;
    }

    // If offline, load from local storage
    if (network.isOffline || network.isServerDown) {
      const localCart = await dispatch(loadLocalCart()).unwrap();

      if (localCart) {
        return {
          formattedItems: localCart.items,
          promoSuggestionList: [],
          fromLocal: true,
        };
      }

      return null;
    }

    // Try to get from server
    try {
      const serverCart = await getCart();

      // Save to local storage as backup
      if (serverCart?.formattedItems?.length > 0) {
        const cartData = {
          items: serverCart.formattedItems,
          itemCount: serverCart.formattedItems.length,
          totalPrice: 0, // Will be recalculated
          lastSync: new Date().toISOString(),
        };
        await AsyncStorage.setItem("cart", JSON.stringify(cartData));
      }

      // Check if there's pending sync
      const needsSync = await AsyncStorage.getItem("cart_needs_sync");
      if (needsSync === "true") {
        dispatch(syncCartToServer());
      }

      return serverCart;
    } catch (error) {
      // Fallback to local storage
      const localCart = await dispatch(loadLocalCart()).unwrap();

      if (localCart) {
        return {
          formattedItems: localCart.items,
          promoSuggestionList: [],
          fromLocal: true,
        };
      }

      throw error;
    }
  },
);
*/

// ─── Clear cart local storage ───────────────────────────────────────────
export const clearCartToServer = createAsyncThunk(
  "cart/clearCartToServer",
  async () => {
    // Clear local storage only (session-based cart)
    await AsyncStorage.removeItem("cart");
  },
);

// ─── Sync pending checkouts (when coming back online) ────────────────────────
export const syncPendingCheckouts = createAsyncThunk(
  "cart/syncPendingCheckouts",
  async (_, { getState }) => {
    const { auth, network } = getState();

    if (!auth.isLoggedIn) {
      return { synced: 0, failed: 0 };
    }

    if (network.isOffline || network.isServerDown) {
      return { synced: 0, failed: 0 };
    }

    try {
      const queueJson = await AsyncStorage.getItem("checkout_queue");
      if (!queueJson) {
        return { synced: 0, failed: 0 };
      }

      const queue = JSON.parse(queueJson);
      const pending = queue.filter((item) => !item.synced);

      if (!pending.length) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0,
        failed = 0;

      for (const checkout of pending) {
        try {
          // Here we would call the checkout API
          // const result = await checkoutApi(checkout.data);
          // For now just mark as synced
          checkout.synced = true;
          synced++;
        } catch (error) {
          failed++;
        }
      }

      // Update queue in storage
      await AsyncStorage.setItem("checkout_queue", JSON.stringify(queue));

      return { synced, failed };
    } catch (error) {
      throw error;
    }
  },
);

// ─── Sync offline cashier transactions ─────────────────────────────────────
export const syncOfflineTransactions = createAsyncThunk(
  "cart/syncOfflineTransactions",
  async (_, { getState }) => {
    const { auth, network } = getState();

    const syncLock = await AsyncStorage.getItem("offline_txn_sync_lock");
    if (syncLock === "true") {
      return { synced: 0, failed: 0, skipped: true };
    }

    await AsyncStorage.setItem("offline_txn_sync_lock", "true");

    try {
      if (!auth.isLoggedIn) {
        return { synced: 0, failed: 0 };
      }

      if (network.isOffline || network.isServerDown) {
        return { synced: 0, failed: 0 };
      }

      const transactionsJson = await AsyncStorage.getItem(
        "offline_transactions",
      );
      if (!transactionsJson) {
        return { synced: 0, failed: 0 };
      }

      const transactions = JSON.parse(transactionsJson);
      if (!Array.isArray(transactions) || !transactions.length) {
        await AsyncStorage.removeItem("offline_transactions");
        return { synced: 0, failed: 0 };
      }

      const uniqueByCode = new Map();
      const withoutCode = [];
      for (const txn of transactions) {
        if (!txn?.checkoutCode) {
          withoutCode.push(txn);
          continue;
        }
        if (!uniqueByCode.has(txn.checkoutCode)) {
          uniqueByCode.set(txn.checkoutCode, txn);
        }
      }

      const uniqueTransactions = Array.from(uniqueByCode.values());
      const dedupedCount = transactions.length - uniqueTransactions.length;

      let synced = 0;
      let failed = 0;
      const remaining = [...withoutCode];

      for (const transaction of uniqueTransactions) {
        try {
          await confirmOrder(transaction);
          synced++;
        } catch (error) {
          failed++;
          remaining.push(transaction);
        }
      }

      if (remaining.length > 0) {
        await AsyncStorage.setItem(
          "offline_transactions",
          JSON.stringify(remaining),
        );
      } else {
        await AsyncStorage.removeItem("offline_transactions");
      }

      return { synced, failed };
    } catch (error) {
      throw error;
    } finally {
      await AsyncStorage.removeItem("offline_txn_sync_lock");
    }
  },
);
