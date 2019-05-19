const tokenAddress = "0x2c1c52946dc54276daa5db9ddce2e929d93eb16e";
const assistConfig = {
    networkId: 4,
    dappId: '743c7131-72eb-48e6-bce6-af5f55796fcc',
};
minGas = 1e16;
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
    let voterList = (await (await fetch('voters.json?3')).json()).map(a => a.toLowerCase());
    if (!voterList.includes(state.accountAddress.toLowerCase())) {
        console.log("no addr");
        $('#welcome-invalid, #btn-go-list').show();
        return;
    }
    let contract = await getContract();
    let bal = await contract.balanceOf.call(state.accountAddress);

    console.log("bal:" + bal.toString());

    if (bal.eq(0)) {
        console.log("no bal");
        $("#welcome-voted, #btn-go-results").show();
        return;
    }

    $('#welcome-valid, #btn-go-anonymize').show();
}

async function stateAnonymize() {
    let proxy = "0xd00B71E95f1c85b856dD54Cb0ad22891eAFaA5de";

    // todo private transfer
}

async function stateVote() {
    // todo vote list

    // todo stats
}

async function stateStats() {
    let contract = await getContract();
    let answerList = await (await fetch('answers.json')).json();
    let results = [];
    let totals = 0;
    for(let ans in answerList) {
        let bal = await contract.balanceOf.call(answerList[ans]);
        results[ans] = bal;
        totals += bal;
    }

    for(let ans in results.sort()) {

    }
}

async function faucetButtonPressed() {
    try {
        activateLoading('#loader3');
        let result = await (await fetch("https://faucet.zdai.io/web3/rinkeby/tokensPlease", {
            method: 'POST',
            body: {"wallet": state.accountAddress},
            headers: {
                'Content-Type': 'application/json'
            }
        })).json();
        if (result.ok && result.success) {
            //location.reload();
            goNext();
        } else {
            alert("cannot transfer tokens: " + result.body);
        }
    }
    catch (error) {
        alert(error);
    }
    finally {
        deactivateLoading('#loader3');
    }
}

const steps = {
    init: 1,
    anonymize: 2,
    vote: 3,
    stats: 4,
    faucet: 0,
};

function switchPage(step) {
    $('.step').hide();
    $('.step-progress').removeClass('active');
    $('#step' + steps[step]).show();
    for (let i = 0; i < steps[step]; i++) {
        $('#step' + i + '-progress').addClass('active');
    }
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

        if (localStorage.state !== 'init' && localStorage.state !== 'stats' && state.accountBalance < minGas) { // todo bigint compare
            switchPage("faucet");
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