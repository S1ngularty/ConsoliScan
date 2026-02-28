const Return = require("../models/ReturnModel");
const Order = require("../models/orderModel");

/**
 * Register WebSocket event handlers for return flow
 * Allows customers and cashiers to join return-specific rooms
 * and receive real-time updates about return status changes
 */
exports.registerReturnEvents = async (socket) => {
  /**
   * Customer/Cashier joins a return room to receive updates
   * Room name format: return:{returnId}
   */
  socket.on("return:join", async ({ returnId }) => {
    if (!returnId) {
      socket.emit("return:error", { message: "returnId is required" });
      return;
    }

    try {
      const returnDoc = await Return.findById(returnId);
      if (!returnDoc) {
        socket.emit("return:error", { message: "Return not found" });
        return;
      }

      const roomName = `return:${returnId}`;
      socket.join(roomName);
      console.log(`[Socket] Client ${socket.id} joined room: ${roomName}`);

      // Send current return state to the client
      socket.emit("return:state", {
        returnId: returnDoc._id,
        status: returnDoc.status,
        inspectionStatus: returnDoc.inspectionStatus,
        fulfillmentType: returnDoc.fulfillmentType,
        loyaltyPointsAwarded: returnDoc.loyaltyPointsAwarded,
        replacementItemId: returnDoc.replacementItemId,
        replacementItemName: returnDoc.replacementItemName,
        createdAt: returnDoc.initiatedAt,
        validatedAt: returnDoc.validatedAt,
        inspectedAt: returnDoc.inspectedAt,
        completedAt: returnDoc.completedAt,
      });
    } catch (error) {
      console.error("[Socket] Error joining return room:", error);
      socket.emit("return:error", { message: "Failed to join return room" });
    }
  });

  /**
   * Request current return status sync
   */
  socket.on("return:sync", async ({ returnId }) => {
    if (!returnId) {
      socket.emit("return:error", { message: "returnId is required" });
      return;
    }

    try {
      const returnDoc = await Return.findById(returnId);
      if (!returnDoc) {
        socket.emit("return:error", { message: "Return not found" });
        return;
      }

      socket.emit("return:state", {
        returnId: returnDoc._id,
        status: returnDoc.status,
        inspectionStatus: returnDoc.inspectionStatus,
        fulfillmentType: returnDoc.fulfillmentType,
        loyaltyPointsAwarded: returnDoc.loyaltyPointsAwarded,
        replacementItemId: returnDoc.replacementItemId,
        replacementItemName: returnDoc.replacementItemName,
        createdAt: returnDoc.initiatedAt,
        validatedAt: returnDoc.validatedAt,
        inspectedAt: returnDoc.inspectedAt,
        completedAt: returnDoc.completedAt,
      });
    } catch (error) {
      console.error("[Socket] Error syncing return:", error);
      socket.emit("return:error", { message: "Failed to sync return" });
    }
  });

  /**
   * Customer leaves return room
   */
  socket.on("return:leave", ({ returnId }) => {
    if (returnId) {
      const roomName = `return:${returnId}`;
      socket.leave(roomName);
      console.log(`[Socket] Client ${socket.id} left room: ${roomName}`);
    }
  });

  /**
   * Handle client disconnect
   */
  socket.on("disconnect", () => {
    console.log(`[Socket] Client ${socket.id} disconnected`);
  });
};
