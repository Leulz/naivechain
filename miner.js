//TODO: reuse code, start using AngularJS
//TODO: solve the "XML Parsing Error: no root element found Location: http://localhost:3001/mineBlock" error when mining.
class Block {
    constructor(index, previousHash, timestamp, data, hash, nonce) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
        this.nonce = nonce;
    }
}

const util = {
  calculateHash: (index, previousHash, timestamp, data, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + nonce).toString();
  },
  checkHex: (n) => {
    return/^[0-9A-Fa-f]{1,64}$/.test(n)
  },
  Hex2Bin: (n) => {
    if(!util.checkHex(n))
      return 0;
    return parseInt(n,16).toString(2)
  },
  calculateHashDifficulty: (hash) => {
    var hashDifficulty = 0;
    var hashBin = util.Hex2Bin(hash);
    while(hashBin.length < hash.length * 4) {
        hashBin = "0" + hashBin;
    }
    for (var i = 0, len = hashBin.length; i < len && hashBin[i] === '0'; i++) {
        hashDifficulty++;
    }
    return hashDifficulty;
  }
};

const sendRequest = (method, endpoint, data) => {
  var deferred = Q.defer();
  var req = new XMLHttpRequest();
  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;
    if (/^[^2]\d\d$/.exec(req.status)) return deferred.reject(req.status);
    deferred.resolve(req.responseText);
  };
  req.open(method,'http://localhost:3001/'+endpoint,true);
  req.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  req.send(data);
  return deferred.promise;
};

const getLatestBlock = () => {
  return sendRequest('GET', 'lastBlock');
};

const getCurrentDifficulty = () => {
  return sendRequest('GET', 'difficulty');
};

const findProperHash = (currentDifficulty, previousBlock, blockData, nonce) => {
  var deferred = Q.defer();

  var nextIndex = previousBlock.index + 1;
  var nextTimestamp = new Date().getTime() / 1000;
  var currentHash = util.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData, nonce);
  var hashDifficulty = util.calculateHashDifficulty(currentHash);
  var timer = new Date();
  for (var i = 0; i < 50; i++) {
    nonce++;
    currentHash = util.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData, nonce);
    hashDifficulty = util.calculateHashDifficulty(currentHash);
    if (hashDifficulty >= currentDifficulty) {
      deferred.resolve(new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, currentHash, nonce));
      return deferred.promise;
    }
  }
  timer = new Date() - timer;
  return Q.delay(timer).then(() => {
    return findProperHash(currentDifficulty,previousBlock,blockData,nonce);
  });
};

const startMining = () => {
  var deferred = Q.defer();
  var blockData = $('.miner-form').serializeArray()[0].value;
  return getLatestBlock().then((previousBlock) => {
    previousBlock = JSON.parse(previousBlock);
    return getCurrentDifficulty().then((data) => {
      data = JSON.parse(data);
      findProperHash(data.difficulty, previousBlock, blockData, 0).then((block) => {
        sendRequest('POST','mineBlock',JSON.stringify(block));
        deferred.resolve(block);
        return deferred.promise;
      });
    });
  });
};