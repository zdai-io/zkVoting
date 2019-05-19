const tokenAddress = "0xdDE42fa8eA6f9DE48c9f4e4a06480C08F5B1888F"; // todo insert prod address
const votingAddress = "0x559301014B74683799185791330e0017D548964a";
const assistConfig = {
    networkId: 4,
    dappId: '743c7131-72eb-48e6-bce6-af5f55796fcc',
};
minGas = 1e16;
const ass = assist.init(assistConfig);
if (!localStorage.state) localStorage.state = "init";
let state;

async function getErcContract() {
    let abi = await (await fetch("abiToken.json")).json();
    return new web3.eth.Contract(abi, tokenAddress, {from:web3.eth.defaultAccount});
    //return ass.Contract(web3.eth.contract(abi).at(tokenAddress));
}
window.getErcContract=getErcContract;

async function getVotingContract() {
    let abi = await (await fetch("abiVoting.json")).json();
    return new web3.eth.Contract(abi, tokenAddress, {from:web3.eth.defaultAccount});
    //return ass.Contract(web3.eth.contract(abi).at(votingAddress));
}
window.getVotingContract=getVotingContract;

const {rbigint, serializeAndHashUTXO, makeProof, addrToInt} = require("../../../src/utils.js");


async function proveDeposit(input) {
    return await makeProof('Deposit', input);
}
window.proveDeposit=proveDeposit;

async function proveVote(input) {
    return await makeProof('Withdrawal', input);
}
window.proveVote=proveVote;

async function stateInit() {
    let voterList = (await (await fetch('voters.json?3')).json()).map(a => a.toLowerCase());
    if (!voterList.includes(state.accountAddress.toLowerCase())) {
        console.log("no addr");
        $('#welcome-invalid, #btn-go-list').show();
        return;
    }
    let contract = await getErcContract();
    //let bal = await contract.balanceOf.call(state.accountAddress);
    let bal = await contract.methods.balanceOf(state.accountAddress).call();
    console.log("bal:" + bal.toString());

    if (bal.eq(0)) {
        console.log("no bal");
        $("#welcome-voted, #btn-go-results").show();
        return;
    }

    $('#welcome-valid, #btn-go-anonymize').show();
}
window.stateInit=stateInit;

async function anonymizeButtonPressed() {
    try {
        activateLoading('#loader2');
        let proxy = $('#justForm').val();

        let salt = rbigint(14);
        localStorage.salt = salt; // save private coin data
        let tx = {
            balance: web3.utils.toWei("1"),
            salt: salt,
            owner: addrToInt(proxy)
        };
        let hash = serializeAndHashUTXO(tx);
        localStorage.hash = hash;
        let input = {
            balance:  web3.utils.toWei("1"),
            salt: salt,
            owner: addrToInt(proxy),
            hash: hash
        };
        let [pi_a, pi_b, pi_c, pubinputs] = await proveDeposit(input);
        let voting = await getVotingContract();
        let result = await voting.methods.deposit(pi_a, pi_b, pi_c, pubinputs).send({from:state.accountAddress, gas:"6000000", gasprice:"2000000000"});
        localStorage.state = 'vote';
        switchPage('vote');
    }
    catch (error) {
        alert(error);
    }
    finally {
        deactivateLoading('#loader2');
    }
}
window.anonymizeButtonPressed=anonymizeButtonPressed;

async function voteButtonPressed() {
    try {
        activateLoading('#loader4');
        if (!localStorage.salt) {
            alert("can't find private hash of your vote in browser storage");
            return ;
        }

        // todo wait until anonymize transaction is mined and ensure that we have it

        let answerList = await (await fetch('answers.json')).json();
        let selected = $('input[name=exampleRadios]:checked', '#voteForm').val();
        let selectedAddr = answerList[selected];

        let selector = Array(10).fill(0);
        selector[answerList.keys().indexOf(selected)] = 1;

        let input = {
            balance: web3.utils.toWei("1"),
            salt: localStorage.salt,
            owner: addrToInt(state.accountAddress),
            all_in_hashes: Array(10).fill(localStorage.hash), // todo fill with actual utxos
            in_selector: selector
        };

        [pi_a, pi_b, pi_c, pubinputs] = await proveVote(input);
        let result = await voting.methods.withdrawal(pi_a, pi_b, pi_c, pubinputs, selectedAddr).send({from:state.accountAddress, gas:"6000000", gasprice:"2000000000"});
        localStorage.state = 'stats';
        switchPage('stats');
        stateStats();
    }
    catch (error) {
        alert(error);
    }
    finally {
        deactivateLoading('#loader4');
    }
}
window.voteButtonPressed=voteButtonPressed;


async function stateStats() {
    let contract = await getErcContract();
    let answerList = await (await fetch('answers.json')).json();
    let results = [], labels = [], series = [];
    let totals = 0;
    for(let ans in answerList) {
        //let bal = await contract.balanceOf.call(answerList[ans]);
        let bal = await contract.methods.balanceOf(answerList[ans]).call();
        results[ans] = bal;
        totals += bal;
    }

    for(let ans in results) { // todo sort
        labels.push(ans);
        series.push(results[ans] / totals);
    }

    new Chartist.Bar('.ct-chart', {labels, series}, {
        distributeSeries: true,
        horizontalBars: true,
        axisX: { showGrid: false },
        axisY: { showGrid: false },
    });
}
window.stateStats=stateStats;


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
window.faucetButtonPressed = faucetButtonPressed;

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
window.switchPage = switchPage;




var Web3 = require('web3');

async function main() {

    window.addEventListener('load', async () => {
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                await ethereum.enable();
            } catch (error) {
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            window.web3 = new Web3(web3.currentProvider);
        }
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    });



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
            case "anonymize": switchPage("anonymize");  break;
            case "vote":      switchPage("vote");       break;
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