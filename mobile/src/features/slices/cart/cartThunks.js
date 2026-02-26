import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCart, getCart, syncCartApi } from "../../../api/cart.api";
import { confirmOrder } from "../../../api/order.api";

// ─── Save cart to local storage ─────────────────────────────────────────────
export const saveLocally = createAsyncThunk(
  "cart/saveLocally",
  async (_, { getState }) => {
    const { cart } = getState();

    console.log("💾 [CART SAVE] Saving cart locally");
    console.log("💾 [CART SAVE] Items count:", cart.cart.length);

    if (cart.cart.length <= 0) {
      console.log("💾 [CART SAVE] Cart empty, clearing local storage");
      await AsyncStorage.removeItem("cart");
      return;
    }

    const cartData = {
      items: cart.cart,
      itemCount: cart.itemCount,
      totalPrice: cart.totalPrice,
      lastSync: new Date().toISOString(),
    };

    await AsyncStorage.setItem("cart", JSON.stringify(cartData));
    console.log(
      "💾 [CART SAVE] Cart saved locally with",
      cart.itemCount,
      "total items",
    );
  },
);

// ─── Load cart from local storage ─────────────────────────────────────────────
export const loadLocalCart = createAsyncThunk(
  "cart/loadLocalCart",
  async () => {
    console.log("📂 [CART LOAD] Loading cart from local storage");

    const cartJson = await AsyncStorage.getItem("cart");
    if (!cartJson) {
      console.log("📂 [CART LOAD] No local cart found");
      return null;
    }

    const cartData = JSON.parse(cartJson);
    console.log(
      "📂 [CART LOAD] Local cart loaded:",
      cartData.itemCount,
      "items",
    );
    console.log("📂 [CART LOAD] Last sync:", cartData.lastSync);

    return cartData;
  },
);

// ─── Sync cart to server (with offline handling) ───────────────────────────────
export const syncCartToServer = createAsyncThunk(
  "cart/syncCartToServer",
  async (_, { getState, dispatch }) => {
    const { cart, auth, network } = getState();

    console.log("🔄 [CART SYNC] Starting cart sync to server");
    console.log("🔄 [CART SYNC] Network state:", {
      isOffline: network.isOffline,
      isServerDown: network.isServerDown,
    });

    // Always save locally first (ensures data safety)
    const { itemCount, totalPrice } = cart;
    await dispatch(
      saveLocally({
        items: cart.cart,
        itemCount,
        totalPrice,
      }),
    );
    console.log("💾 [CART SYNC] Local backup complete");

    // Check if user is logged in
    if (!auth.isLoggedIn) {
      console.log("⚠️ [CART SYNC] User not logged in, skipping server sync");
      return { synced: false, reason: "not_logged_in" };
    }

    // Check network status
    if (network.isOffline || network.isServerDown) {
      console.log("⚠️ [CART SYNC] Offline mode detected, saved locally only");
      await AsyncStorage.setItem("cart_needs_sync", "true");
      return { synced: false, reason: "offline", needsSync: true };
    }

    // Empty cart check
    if (cart.cart.length <= 0) {
      console.log("⚠️ [CART SYNC] Cart is empty, skipping sync");
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

    console.log("🔄 [CART SYNC] Syncing", itemCount, "items to server");

    try {
      await syncCartApi(data);
      await AsyncStorage.removeItem("cart_needs_sync");
      console.log("✅ [CART SYNC] Successfully synced to server");
      return { synced: true, itemCount };
    } catch (error) {
      console.error("❌ [CART SYNC] Failed to sync:", error.message);
      await AsyncStorage.setItem("cart_needs_sync", "true");
      throw error;
    }
  },
);

// ─── Get cart from server (with offline fallback) ─────────────────────────────
export const getCartFromServer = createAsyncThunk(
  "cart/getCartFromServer",
  async (_, { getState, dispatch }) => {
    const { auth, network } = getState();

    console.log("📥 [CART GET] Fetching cart from server");
    console.log("📥 [CART GET] Network state:", {
      isOffline: network.isOffline,
      isServerDown: network.isServerDown,
    });

    if (!auth.isLoggedIn) {
      console.log("⚠️ [CART GET] User not logged in");
      return null;
    }

    // If offline, load from local storage
    if (network.isOffline || network.isServerDown) {
      console.log("🔌 [CART GET] Offline mode, loading from local storage");
      const localCart = await dispatch(loadLocalCart()).unwrap();

      if (localCart) {
        console.log(
          "✅ [CART GET] Loaded",
          localCart.itemCount,
          "items from local storage",
        );
        return {
          formattedItems: localCart.items,
          promoSuggestionList: [],
          fromLocal: true,
        };
      }

      console.log("⚠️ [CART GET] No local cart found");
      return null;
    }

    // Try to get from server
    try {
      const serverCart = await getCart();
      console.log("✅ [CART GET] Successfully fetched from server");
      console.log(
        "✅ [CART GET] Items:",
        serverCart?.formattedItems?.length || 0,
      );

      // Save to local storage as backup
      if (serverCart?.formattedItems?.length > 0) {
        const cartData = {
          items: serverCart.formattedItems,
          itemCount: serverCart.formattedItems.length,
          totalPrice: 0, // Will be recalculated
          lastSync: new Date().toISOString(),
        };
        await AsyncStorage.setItem("cart", JSON.stringify(cartData));
        console.log("💾 [CART GET] Saved server cart to local storage");
      }

      // Check if there's pending sync
      const needsSync = await AsyncStorage.getItem("cart_needs_sync");
      if (needsSync === "true") {
        console.log("🔄 [CART GET] Pending sync detected, triggering sync");
        dispatch(syncCartToServer());
      }

      return serverCart;
    } catch (error) {
      console.error(
        "❌ [CART GET] Failed to fetch from server:",
        error.message,
      );

      // Fallback to local storage
      console.log("🔌 [CART GET] Falling back to local storage");
      const localCart = await dispatch(loadLocalCart()).unwrap();

      if (localCart) {
        console.log(
          "✅ [CART GET] Loaded",
          localCart.itemCount,
          "items from local fallback",
        );
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

// ─── Clear cart (server and local) ───────────────────────────────────────────
export const clearCartToServer = createAsyncThunk(
  "cart/clearCartToServer",
  async (_, { getState }) => {
    const { auth, network } = getState();

    console.log("🗑️ [CART CLEAR] Clearing cart");

    // Always clear local storage
    await AsyncStorage.removeItem("cart");
    await AsyncStorage.removeItem("cart_needs_sync");
    console.log("🗑️ [CART CLEAR] Local cart cleared");

    if (!auth.isLoggedIn) {
      console.log("⚠️ [CART CLEAR] User not logged in, local clear only");
      return;
    }

    // Try to clear on server if online
    if (!network.isOffline && !network.isServerDown) {
      try {
        await clearCart();
        console.log("✅ [CART CLEAR] Server cart cleared");
      } catch (error) {
        console.error(
          "❌ [CART CLEAR] Failed to clear server cart:",
          error.message,
        );
      }
    } else {
      console.log("🔌 [CART CLEAR] Offline mode, server clear skipped");
    }
  },
);

// ─── Sync pending checkouts (when coming back online) ────────────────────────
export const syncPendingCheckouts = createAsyncThunk(
  "cart/syncPendingCheckouts",
  async (_, { getState }) => {
    const { auth, network } = getState();

    console.log("🔄 [CHECKOUT SYNC] Checking for pending checkouts");

    if (!auth.isLoggedIn) {
      console.log("⚠️ [CHECKOUT SYNC] User not logged in");
      return { synced: 0, failed: 0 };
    }

    if (network.isOffline || network.isServerDown) {
      console.log("🔌 [CHECKOUT SYNC] Still offline, skipping sync");
      return { synced: 0, failed: 0 };
    }

    try {
      const queueJson = await AsyncStorage.getItem("checkout_queue");
      if (!queueJson) {
        console.log("✅ [CHECKOUT SYNC] No pending checkouts");
        return { synced: 0, failed: 0 };
      }

      const queue = JSON.parse(queueJson);
      const pending = queue.filter((item) => !item.synced);

      if (!pending.length) {
        console.log("✅ [CHECKOUT SYNC] All checkouts already synced");
        return { synced: 0, failed: 0 };
      }

      console.log(
        "📤 [CHECKOUT SYNC] Processing",
        pending.length,
        "pending checkouts",
      );

      let synced = 0,
        failed = 0;

      for (const checkout of pending) {
        try {
          console.log("📤 [CHECKOUT SYNC] Syncing checkout:", checkout.id);
          // Here we would call the checkout API
          // const result = await checkoutApi(checkout.data);
          // For now just mark as synced
          checkout.synced = true;
          synced++;
        } catch (error) {
          console.error(
            "❌ [CHECKOUT SYNC] Failed to sync checkout",
            checkout.id,
            error.message,
          );
          failed++;
        }
      }

      // Update queue in storage
      await AsyncStorage.setItem("checkout_queue", JSON.stringify(queue));

      console.log(
        "✅ [CHECKOUT SYNC] Sync complete:",
        synced,
        "synced,",
        failed,
        "failed",
      );

      return { synced, failed };
    } catch (error) {
      console.error(
        "❌ [CHECKOUT SYNC] Error syncing checkouts:",
        error.message,
      );
      throw error;
    }
  },
);

// ─── Sync offline cashier transactions ─────────────────────────────────────
export const syncOfflineTransactions = createAsyncThunk(
  "cart/syncOfflineTransactions",
  async (_, { getState }) => {
    const { auth, network } = getState();

    console.log("🔄 [OFFLINE TXN SYNC] Checking for offline transactions");

    const syncLock = await AsyncStorage.getItem("offline_txn_sync_lock");
    if (syncLock === "true") {
      console.log("⏳ [OFFLINE TXN SYNC] Sync already in progress, skipping");
      return { synced: 0, failed: 0, skipped: true };
    }

    await AsyncStorage.setItem("offline_txn_sync_lock", "true");

    try {
      if (!auth.isLoggedIn) {
        console.log("⚠️ [OFFLINE TXN SYNC] User not logged in");
        return { synced: 0, failed: 0 };
      }

      if (network.isOffline || network.isServerDown) {
        console.log("🔌 [OFFLINE TXN SYNC] Still offline, skipping sync");
        return { synced: 0, failed: 0 };
      }

      const transactionsJson = await AsyncStorage.getItem(
        "offline_transactions",
      );
      console.log(
        "📦 [OFFLINE TXN SYNC] Storage payload:",
        transactionsJson ? "found" : "empty",
      );
      if (!transactionsJson) {
        console.log("✅ [OFFLINE TXN SYNC] No offline transactions");
        return { synced: 0, failed: 0 };
      }

      const transactions = JSON.parse(transactionsJson);
      console.log(
        "📦 [OFFLINE TXN SYNC] Loaded transactions:",
        Array.isArray(transactions) ? transactions.length : "invalid",
      );
      if (!Array.isArray(transactions) || !transactions.length) {
        await AsyncStorage.removeItem("offline_transactions");
        console.log("✅ [OFFLINE TXN SYNC] Empty offline transactions list");
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
      if (dedupedCount > 0) {
        console.log(
          "🧹 [OFFLINE TXN SYNC] Deduped transactions:",
          dedupedCount,
        );
      }

      let synced = 0;
      let failed = 0;
      const remaining = [...withoutCode];

      for (const transaction of uniqueTransactions) {
        try {
          console.log(
            "📤 [OFFLINE TXN SYNC] Syncing transaction:",
            transaction.checkoutCode,
          );
          await confirmOrder(transaction);
          synced++;
        } catch (error) {
          console.error(
            "❌ [OFFLINE TXN SYNC] Failed to sync transaction",
            transaction.checkoutCode,
            error.message,
          );
          failed++;
          remaining.push(transaction);
        }
      }

      if (remaining.length > 0) {
        await AsyncStorage.setItem(
          "offline_transactions",
          JSON.stringify(remaining),
        );
        console.log(
          "🧾 [OFFLINE TXN SYNC] Keeping",
          remaining.length,
          "transactions for retry",
        );
      } else {
        await AsyncStorage.removeItem("offline_transactions");
        console.log("🧾 [OFFLINE TXN SYNC] Cleared offline transaction cache");
      }

      console.log(
        "✅ [OFFLINE TXN SYNC] Sync complete:",
        synced,
        "synced,",
        failed,
        "failed",
      );

      return { synced, failed };
    } catch (error) {
      console.error(
        "❌ [OFFLINE TXN SYNC] Error syncing offline transactions:",
        error.message,
      );
      throw error;
    } finally {
      await AsyncStorage.removeItem("offline_txn_sync_lock");
    }
  },
);
