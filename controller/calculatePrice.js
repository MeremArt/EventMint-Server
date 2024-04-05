const BigNumber = require("bignumber.js");
const { products } = require("./products");

function calculatePrice(query) {
  let amount = new BigNumber(0);
  for (let [id, quantity] of Object.entries(query)) {
    const product = products.find((p) => p.id === id);
    if (!product) continue;

    const price = product.priceSol;
    const productQuantity = new BigNumber(quantity);
    amount = amount.plus(productQuantity.multipliedBy(price));
  }

  return amount;
}

module.exports = calculatePrice;
