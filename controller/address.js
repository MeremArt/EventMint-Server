const { PublicKey } = require("@solana/web3.js");

// Your shop wallet address
const shopAddress = new PublicKey(
  "BYXNFfUKTsWYzoXgZHTKtjBmpbSnwsEQqUz6RyfBKQRm"
);

module.exports = {
  shopAddress: shopAddress,
};
