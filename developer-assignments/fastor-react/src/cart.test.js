import { test } from "node:test";
import assert from "node:assert/strict";
import { addItem, cartTotal } from "./cart.js";
test("cart merges matching portions and keeps different portions separate", () => {
  const food = { id: "pizza", name: "Pizza", price: 14 };
  const small = { label: "Personal", extra: 0 },
    large = { label: "Family", extra: 6 };
  let cart = addItem([], food, small, 2);
  cart = addItem(cart, food, small, 1);
  cart = addItem(cart, food, large, 1);
  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 3);
  assert.equal(cartTotal(cart), 62);
});
