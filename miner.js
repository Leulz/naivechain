//Use $http to send requests

var util = require('./util.js');
var Block = require('./block.js');

var app = angular.module('miner-app',[]);

app.controller('MinerController', ['$scope', '$q', '$timeout', function($scope, $q, $timeout) {

  $scope.blockData = "";

  const sendRequest = (method, endpoint, data) => {
    var deferred = $q.defer();
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
    var deferred = $q.defer();

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
    deferred.resolve();
    timer = new Date() - timer;
    return deferred.promise.then(function(){
      return $timeout(timer);
    }).then(() => {
      return findProperHash(currentDifficulty,previousBlock,blockData,nonce);
    });
  };

  $scope.startMining = () => {
    return getLatestBlock().then((previousBlock) => {
      previousBlock = JSON.parse(previousBlock);
      return getCurrentDifficulty().then((data) => {
        data = JSON.parse(data);
        return findProperHash(data.difficulty, previousBlock, $scope.blockData, 0).then((block) => {
          return sendRequest('POST','mineBlock',JSON.stringify(block)).then((success) => {
            console.log("Block successfully mined and attached to the blockchain!")
          }, (rejection) => {
            console.log("The blockchain rejected the block mined.");
          });
        }, (rejection) => {
          console.log("Failed to find the proper hash, what kinda difficulty are you using?!");
        });
      }, (rejection) => {
        console.log("Failed to get current difficulty, possibly due to a problem with the server");
      });
    }, (rejection) => {
      console.log("Failed to get previous block, possibly due to a problem with the server.")
    });
  };
}]);