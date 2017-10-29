const CryptoJS = require("crypto-js");

const calculateHash = (index, previousHash, timestamp, data, nonce) => {
  return CryptoJS.SHA256(index + previousHash + timestamp + data + nonce).toString();
};

const checkHex = (n) => {
  return/^[0-9A-Fa-f]{1,64}$/.test(n)
};

const Hex2Bin = (n) => {
  if(!checkHex(n))
    return 0;
  return parseInt(n,16).toString(2)
};

const calculateHashDifficulty = (hash) => {
  var hashDifficulty = 0;
  var hashBin = Hex2Bin(hash);
  while(hashBin.length < hash.length * 4) {
      hashBin = "0" + hashBin;
  }
  for (var i = 0, len = hashBin.length; i < len && hashBin[i] === '0'; i++) {
      hashDifficulty++;
  }
  return hashDifficulty;
};

module.exports = {
  calculateHash: calculateHash,
  checkHex: checkHex,
  Hex2Bin: Hex2Bin,
  calculateHashDifficulty: calculateHashDifficulty
};