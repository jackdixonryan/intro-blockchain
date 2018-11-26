const express = require('express');
const uuid = require('uuid/v1');
const rp = require('request-promise');

const PORT = process.argv[2];
const app = express();
const nodeAddress = uuid().split('-').join('');

const Blockchain = require("./chain/blockchain");
const bitMiner = new Blockchain();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/api/blockchain', (req, res) => {
  res.send(bitMiner);
});

app.post('/api/transaction', (req, res) => {
  const transaction = {
    amount: req.body.amount,
    sender: req.body.sender,
    recipient: req.body.recipient
  };

  bitMiner.addTransactionToPendingTransactions(transaction);

  res.json({ note: "Successfully Posted Said Transaction." });
});

app.post('/api/transaction/broadcast', (req, res) => {
  const newTransaction = bitMiner.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);

  bitMiner.addTransactionToPendingTransactions(newTransaction);

  const requestPromises = [];
  bitMiner.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: "POST",
      body: newTransaction,
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(data => {
      res.json({ note: "Broadcasted transaction to the network." });
    });
});

app.get("/api/mine", (req, res) => {
  const lastBlock = bitMiner.getLastBlock();
  const previousBlockHash = lastBlock['hash'];

  const currentBlockData = {
    transactions: bitMiner.pendingTransactions,
    index: lastBlock['index'] + 1
  }

  const nonce = bitMiner.proofOfWork(previousBlockHash, currentBlockData);

  const blockHash = bitMiner.hashBlock(previousBlockHash, currentBlockData, nonce);

  bitMiner.createNewTransaction(10, "BANK_OF_TWAIN", nodeAddress);

  const newBlock = bitMiner.createNewBlock(nonce, previousBlockHash, blockHash);

  res.json({
    note: "New block mined successfully",
    block: newBlock
  });
});

app.post('/api/broadcast', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (bitMiner.networkNodes.indexOf(newNodeUrl) == -1) {
    bitMiner.networkNodes.push(newNodeUrl);
  }

  const regNodesPromises = [];
  bitMiner.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/api/register',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true
    };

    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
  .then(data => {
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/api/bulk-register',
      method: 'POST',
      body: { allNetworkNodes: [ ...bitMiner.networkNodes, bitMiner.currentNodeUrl ]},
      json: true
    };
    return rp(bulkRegisterOptions);
  })
  .then(data => {
    res.json({ note: 'New node registered with network successfully.'});
  });
});

app.post('/api/register', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = bitMiner.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = bitMiner.currentNodeUrl !== newNodeUrl;

  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitMiner.networkNodes.push(newNodeUrl);
    res.json({ note: "Registered a new node." });
  } else {
    res.json({ note: "This node could not be registered." });
  }
});

app.post('/api/bulk-register', (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent = bitMiner.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = bitMiner.currentNodeUrl !== networkNodeUrl;

    if (nodeNotAlreadyPresent && notCurrentNode) {
      bitMiner.networkNodes.push(networkNodeUrl);
    }
  });
  res.json({ note: "Bulk registration successful." });
});


app.listen(PORT, () => {
  console.log("Running.");
});