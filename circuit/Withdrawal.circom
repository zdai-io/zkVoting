include "UTXOHasher.circom";

template Selector(n) {
  signal input in[n];
  signal input sel[n];
  signal output out;
  signal t[n];

  var s1 = 0;
  var s2 = 0;

  for (var i = 0; i < n; i++){
    sel[i] * sel[i] === sel[i]
    s1 += sel[i];
    t[i] <== sel[i] * in[i];
    s2 += t[i];
  }
  s1 === 1
  s2 ==> out
}


template Withdrawal() {
  signal input balance;
  signal input salt
  signal input owner;
  signal input all_in_hashes[10];
  signal private input in_selector[10];

  component in_hash = Selector(10);
  var i;
  for(i=0; i<10; i++) {
    in_hash.in[i] <== all_in_hashes[i];
    in_hash.sel[i] <== in_selector[i];
  }

  component hasher = UTXOHasher();

  hasher.balance <== balance;
  hasher.salt <== salt;
  hasher.owner <== owner;
  in_hash.out === hasher.hash;

}

component main = Withdrawal()
