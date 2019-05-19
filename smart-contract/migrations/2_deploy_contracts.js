const Voting = artifacts.require('Voting');
const VotingToken = artifacts.require('VotingToken');
const Verifier = artifacts.require('Verifier');



module.exports = async function (deployer, network, accounts) {
    const operator = accounts[0];

    await deployer.deploy(Verifier);
    const verifier = await Verifier.deployed();

    await deployer.deploy(VotingToken, "VotingToken", "VOT", 18);
    const token = await VotingToken.deployed();
    
    await deployer.deploy(Voting, verifier.address, token.address);
    const voting = await Voting.deployed();
    console.log(voting.address, token.address);


};
