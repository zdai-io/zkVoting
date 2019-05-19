const tokenAddress = "0x2c1c52946dc54276daa5db9ddce2e929d93eb16e";
const voterList = ["0xb6762AEc2b3cD39d31651CB48F38D1Cd4FDaFb8B"].map(a => a.toLowerCase());
const answerList = {
    "a": "q"
};
const assistConfig = {
    networkId: 4,
    dappId: '743c7131-72eb-48e6-bce6-af5f55796fcc',
};
const ass = assist.init(assistConfig);
if (!localStorage.state) localStorage.state = "init";
let state;

async function getContract() {
    let abi = await (await fetch("abi.json")).json();
    return ass.Contract(web3.eth.contract(abi).at(tokenAddress));
}

async function makeProof(name, input) {

}

async function stateInit() {
    if (!voterList.includes(state.accountAddress.toLowerCase())) {
        console.log("no addr");
        // todo Your address is not in list of EthNewYork attendees, please select address
        //   you used to stake on kickback. [[List]]
        return;
    }
    let contract = await getContract();
    let bal = await contract.balanceOf.call(addr);

    console.log("bal:" + bal.toString());

    if (bal.eq(0)) {
        console.log("no bal");
        // todo Your address doesn't contain a vote token, looks like you already voted with this address
        // button go to results page
        return;
    }

    // todo your address is eligible to cast a vote, press next to continue
}

async function stateAnonymize() {
    // First, you need to make a shielded transfer of your token to another address
    // that will be used to submit your vote. Generate a new wallet and enter its address below:
    let proxy = "0xd00B71E95f1c85b856dD54Cb0ad22891eAFaA5de";

    // todo private transfer
}

async function stateVote() {
    // todo vote list
    // Submit your vote for one of those options

    // todo stats
}

async function stateStats() {
    let contract = await getContract();
    for(let ans in answerList) {
        let bal = await contract.balanceOf.call(answerList[ans]);
        ///
    }
}

async function stateFaucet() {
    // Looks like your wallet doesn't have any eth on it. You will need some to pay the gas fee
    // You can get some Rinkeby ether for free by clicking this button
    // todo
    //
    let result = await fetch("https://faucet.zdai.io/web3/rinkeby/tokensPlease", {
        method: 'POST',
        body: {"wallet": state.accountAddress},
        headers:{
            'Content-Type': 'application/json'
        }
    });
    if (result.ok && result.success) {
        // todo
    } else {
        console.log("cannot transfer tokens: " + result.body);
    }
}

function switchPage() {

}

async function main() {
    try {
        state = await ass.onboard();
        // User has been successfully onboarded and is ready to transact
        // This means we can be sure of the following user properties:
        //  - They are using a compatible browser
        //  - They have a web3-enabled wallet installed
        //  - The wallet is connected to the config-specified networkId
        //  - The wallet is unlocked and contains at least `minimumBalance` in wei
        //  - They have connected their wallet to the dapp, congruent with EIP1102

        if (state.accountBalance < minGas) { // todo bigint compare
            switchPage("faucet");
            await stateFaucet();
        }

        switch (localStorage.state) {
            case "init":      switchPage("init");       await stateInit(); break;
            case "anonymize": switchPage("anonymize");  await stateAnonymize(); break;
            case "vote":      switchPage("vote");       await stateVote(); break;
            case "stats":     switchPage("stats");      await stateStats(); break;
            default: console.log("Invalid state " + localStorage.state);
        }
    } catch (error) {
        // The user exited onboarding before completion
        // Will let you know which stage of onboarding the user reached when they exited
        console.log(error.message);
    }
}

main();