export function addItem(cart, product, portion, quantity) {
  const key = `${product.id}-${portion.label}`;
  const existing = cart.find((item) => item.key === key);
  if (existing)
    return cart.map((item) =>
      item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
    );
  return [
    ...cart,
    {
      key,
      id: product.id,
      name: product.name,
      image: product.image,
      portion: portion.label,
      price: product.price + portion.extra,
      quantity,
    },
  ];
}
export function cartTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}
