# Anonymous voting

Based on Vitalik's proposal from ETH New York hackathon.

## Research objective 

Plutocracy or pressure on voters is well-known issues. We to describe how to solve it via cryptography.

In our model there are 3 kinds of participants:
* voters
* counters
* stakeholders (candidates, etc)

We need to guarantee the following properties of the protocol:
1. Any voter can hide his personality from anybody (including without limitation if counters cooperate with stakeholders)
2. Any voter cannot create proof that he has voted for any choice (during voting and after counting)
3. Voters cannot transfer control for their votes to other persons exclusively.
4. It is guaranteed for any voter that his last vote is counted.

## Solution

1. Users get voting rights from the smart contract for their ethereum accounts
2. Users create unique secret as`secret = hash(address,salt1)` and publish `account_hash = hash(secret, salt2)` at the smart contract. Also, users publish snark proof, that the computation is correct. This procedure can be executed only once for each account with voting rights. 
4. Users can anonymously not exclusively delegate their voting rights to another account, publishing a snark with multiple existed `account_hash` public input, new `account_hash` public output (corresponding to the same secret, but another salt) and private selector of one of the inputted accounts.
5. Users publish encrypted via counters private key `message = {voting_vector, secret}` and snark proof that message is correct and encryption is correct.
6. After the end of voting counters MapReduce all messages from last to first via snarks without publishing any subtotals. If the secret is new, we increment subtotal vector and add the secret to set of known secrets during the counting (how to do it is described [here](https://ethresear.ch/t/shorter-merkle-proofs-for-snapps/4044) ). If the secret is not new, we pass the addition and just update the state's salt to hide from others that the secret is not new here.
7. After the end of the counting, the resulting vector is published with proof.

