![](https://i.imgur.com/9L5yKrr.jpg)

## Inspiration of Anonymous voting

**Anonymous voting** is Based on Vitalik's opening speech and proposal from ETHNewYork hackathon.


Vitalik's opening speech touched on the fight against plutocracy, and how to eliminate bribes with the help of game theory and zkSnarks. So we decided to BUIDL it!


## What it does

**It is a voting constructor. The zkSnark based framework that will generate voting with the selected parameters.**

We implemented the "Best Gold Sponsor award" with Anonymous voting by all hackathon participants (according to kickback list of attendees: https://kickback.events/event/0x4905b4f22d8cdb0a035b17062e2d498b662991bc)

---

### Research objective

Plutocracy or pressure on voters is well-known issues. We to describe how to solve it via cryptography.

In our model, there are 3 kinds of participants:
* voters
* counters
* stakeholders (candidates, etc)

We need to guarantee the following properties of the protocol:
1. Any voter can hide his personality from anybody (including without limitation if counters cooperate with stakeholders)
2. Any voter cannot create proof that he has voted for any choice (during voting and after counting)
3. Voters cannot transfer control for their votes to other persons exclusively.
4. It is guaranteed for any voter that his last vote is counted.


## How we built it
Circom based zkSnarks, with ideas from miximus. (Thank you Vitalik for your article about voting)

---

### Solution

1. Users get voting rights from the smart contract for their ethereum accounts
2. Users create unique secret as`secret = hash(address,salt1)` and publish `account_hash = hash(secret, salt2)` at the smart contract. Also, users publish snark proof, that the computation is correct. This procedure can be executed only once for each account with voting rights.
4. Users can anonymously not exclusively delegate their voting rights to another account, publishing a snark with multiple existed `account_hash` public input, new `account_hash` public output (corresponding to the same secret, but another salt) and private selector of one of the inputted accounts.
5. Users publish encrypted via counters private key `message = {voting_vector, secret}` and snark proof that message is correct and encryption is correct.
6. After the end of voting counters MapReduce all messages from last to first via snarks without publishing any subtotals. If the secret is new, we increment subtotal vector and add the secret to set of known secrets during the counting (how to do it is described [here](https://ethresear.ch/t/shorter-merkle-proofs-for-snapps/4044) ). If the secret is not new, we pass the addition and just update the state's salt to hide from others that the secret is not new here.
7. After the end of the counting, the resulting vector is published with proof.




## Challenges we ran into

And now on the blockchain it seems there are no normal votes, i.e. in classical implementations, it is done in such a way that the votes are visible before the voting is closed. That there is a serious violation of the privacy and the latter can greatly influence the outcome of the vote.


## Accomplishments that we're proud of

In addition to anonymous voting this project will allow you to customize settings for voting:

- Developers without getting into cryptography will have all the advantages and safety of Snarks under the hood.
- Any EVM-compatible platform will have the opportunity **to make voting really secure and safe**!

## What we learned
Sending all the private  information on-chain  is a quite challenging but very important part of completely decentralized voting

## What's next for I vote you!

We want to improve the constructor and add some essential features like:

### Vote zkSNARK params:

- Connect to KYC provider/whitelist (choose who can participate)
- determine the number of people in the voting
- install Open — closed vote rules
- Ability to delegate their votes
- execution endpoint after voting (smart contract method call)
- Ability to re-vote
- Quorum: set the percentage of voters (by Fiat–Shamir algorithm )
- vote recall (looks like a vote)

And voila - we have a voting element that is ready-to-use!

We can also submit this feature to Aragon and other EVM-compatible blockchains and sidechains.
So we want put the ZKP technology forward in the world!


---
 ## Sponsor  nominations:

### ENS
We will use `vote.skywinder.ens` on mainnet (it already registered). For Demo voting on the hackathon, we are using rinkeby

### Skale
We deployed contracts to skale and put data to their file manager.

### Thundercore
Since it's EVM-compatible blockchain - we put our contract on this network and to do very fast and private voting.

### Graph:
We parsed kickback adresses by Graph API. So only whitelisted and registered address can vote for the "Best Gold Sponsor award". https://thegraph.com/explorer/subgraph/skywinder/kickback
