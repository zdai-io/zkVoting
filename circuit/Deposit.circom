include "UTXOHasher.circom";

template Deposit() {
  signal input balance;
  signal input hash;

  signal private input owner;
  signal private input salt

  component hasher = UTXOHasher();

  hasher.balance <== balance;
  hasher.salt <== salt;
  hasher.owner <== owner;
  hash === hasher.hash;

}

component main = Deposit()
