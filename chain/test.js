const Blockchain = require("./blockchain");

const bitMiner = new Blockchain();

const previousBlockHash = "@#4dfkjnaimnsfgtkjsooom,dbfgdfg"
const currentBlockData = [
  {
    amount: 12,
    sender: "Twain",
    recipient: "Cool"
  },
  {
    amount: 10,
    sender: "SALLY",
    recipient: "MICK"
  },
  {
    amount: 500,
    sender: "JIMBOB",
    recipient: "COOTER"
  },
];

console.log(bitMiner);

// console.log(bitMiner.proofOfWork(previousBlockHash, currentBlockData, 19210));
// console.log(bitMiner.hashBlock(previousBlockHash, currentBlockData, 19210));