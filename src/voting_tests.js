const env = process.env;
if (env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config({ path: 'smart-contract/.env' });
  dotenv.load()
}


const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require("fs");
const Web3 = require("web3");

const {stringifyBigInts, unstringifyBigInts, p256, fload, fdump, rbigint, serializeAndHashUTXO, shuffle, addrToInt, makeProof} = require("./utils.js");


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




  async function processVoting(_account, _anonymousAccount) {
    const account = addrToInt(_account);
    const anonymousAccount = addrToInt(_anonymousAccount);
    const _balance = "1";
    const balance = toWei(_balance);
    const to = candidates[Math.floor(Math.random()*2)];


    let salt = rbigint(14);
    let tx = {
      balance: balance,
      salt: salt,
      owner: anonymousAccount
    };

    let hash = serializeAndHashUTXO(tx);
    let input = {
      balance: balance,
      salt: salt,
      owner: anonymousAccount,
      hash: hash
    };

    console.log("Current balance: "+web3.utils.fromWei(await token.methods.balanceOf(_account).call()));

    let [pi_a, pi_b, pi_c, pubinputs] = await makeProof('Deposit', input);
    await voting.methods.deposit(pi_a, pi_b, pi_c, pubinputs).send({from:_account, gas:"6000000", gasprice:"2000000000"});
    
    console.log("Balance after deposit "+web3.utils.fromWei(balance)+ ": " +web3.utils.fromWei(await token.methods.balanceOf(_account).call()));

    input = {
      balance: balance,
      salt: salt,
      owner: anonymousAccount,
      all_in_hashes: Array(10).fill(hash),
      in_selector: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    [pi_a, pi_b, pi_c, pubinputs] = await makeProof('Withdrawal', input);
    await voting.methods.withdrawal(pi_a, pi_b, pi_c, pubinputs, to).send({from:_anonymousAccount, gas:"6000000", gasprice:"2000000000"});

    console.log("Balance after withdrawal: "+web3.utils.fromWei(await token.methods.balanceOf(_account).call()));
    console.log("Sent "+web3.utils.fromWei(balance)+" token to "+to);

  }


  // create tokens for all voters;

  for(let i in voters)  {
    await token.methods.mint(voters[i], toWei("1")).send();
    await token.methods.approve(voting.options.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").send({from: voters[i]});
  }

  await processVoting(voters[0], votersAnonymous[0]);



  process.exit()
})()