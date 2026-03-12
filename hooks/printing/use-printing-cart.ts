"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addPrintingCartItem,
  clearPrintingCart,
  deletePrintingCartItem,
  getPrintingCart,
  updatePrintingCartItem,
} from "@/lib/api/printing";
import {
  AddPrintingCartItemPayload,
  PrintingCartResponse,
  UpdatePrintingCartItemPayload,
} from "@/lib/types/printing";

const EMPTY_CART: PrintingCartResponse = {
  total_items: 0,
  total_quantity: 0,
  subtotal: 0,
  delivery_charge: 0,
  total_amount: 0,
  currency: "BDT",
  items: [],
};

function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function usePrintingCart() {
  const [cart, setCart] = useState<PrintingCartResponse>(EMPTY_CART);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const reloadCart = useCallback(async () => {
    setIsCartLoading(true);
    setCartError(null);
    try {
      const response = await getPrintingCart();
      setCart(response);
    } catch (error) {
      setCartError(getErrorMessage(error, "Failed to load cart"));
      setCart(EMPTY_CART);
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadCart();
  }, [reloadCart]);

  const addItems = useCallback(async (payload: AddPrintingCartItemPayload) => {
    setIsMutating(true);
    setCartError(null);
    try {
      const response = await addPrintingCartItem(payload);
      setCart(response);
      return response;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to add item to cart");
      setCartError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateItem = useCallback(async (pk: number, payload: UpdatePrintingCartItemPayload) => {
    setIsMutating(true);
    setCartError(null);
    try {
      const response = await updatePrintingCartItem(pk, payload);
      setCart(response);
      return response;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update cart item");
      setCartError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const removeItem = useCallback(async (pk: number) => {
    setIsMutating(true);
    setCartError(null);
    try {
      const response = await deletePrintingCartItem(pk);
      setCart(response);
      return response;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to remove cart item");
      setCartError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsMutating(true);
    setCartError(null);
    try {
      const response = await clearPrintingCart();
      setCart(response);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to clear cart");
      setCartError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    cart,
    isCartLoading,
    isMutating,
    cartError,
    reloadCart,
    addItems,
    updateItem,
    removeItem,
    clearCart,
  };
}
