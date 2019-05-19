const env = process.env;
if (env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config({ path: 'smart-contract/.env' });
  dotenv.load()
}


const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require("fs");
const Web3 = require("web3");
//const circom = require("circom");
//const snarkjs = require("snarkjs");
//const groth = snarkjs["groth"];
//const pedersen = require("../circomlib/src/pedersenHash.js");
//const babyjub = require("../circomlib/src/babyjub.js");
//const crypto = require("crypto");
//const bigInt = require("big-integer");
const {stringifyBigInts, unstringifyBigInts, p256, fload, fdump, rbigint, serializeAndHashUTXO, shuffle, addrToInt, makeProof} = require("./utils.js");
//const {spawn} = require('child_process');


const alt_bn_128_q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;





const web3 = new Web3(new HDWalletProvider(env.MNEMONIC, env.ETHEREUM_RPC, 0, 10));




const toBN = web3.utils.toBN;
const toWei = web3.utils.toWei;
const fromWei = web3.utils.fromWei;



(async () => {
  const accounts = await web3.eth.getAccounts();
  const netid = await web3.eth.net.getId();
  const owner = accounts[0];
  const voters = accounts.slice(1, 4);
  const votersAnonymous = accounts.slice(4,7);
  const candidates = accounts.slice(7, 9);

  const tokenData = JSON.parse(fs.readFileSync("smart-contract/build/contracts/VotingToken.json", "utf8"));
  const votingData = JSON.parse(fs.readFileSync("smart-contract/build/contracts/Voting.json", "utf8"));



  const token = new web3.eth.Contract(tokenData.abi, tokenData.networks[netid].address, { from: owner });
  const voting = new web3.eth.Contract(votingData.abi, votingData.networks[netid].address, { from: owner });


  // create tokens for all voters;

  for(let i in voters)  {
    await token.methods.mint(voters[i], toWei("1")).send();
    await token.methods.approve(voting.options.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").send({from: voters[i]});
  }



  process.exit()
})()