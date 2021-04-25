const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiled_contract = require('./compile');
const bytecode = compiled_contract.evm.bytecode.object;
const abi = compiled_contract.abi;

// Use a metamask mnemonic which you can afford to share.
// Please please please, do not share your actual mnemonic which can expose your accounts with real money.
const provider = new HDWalletProvider(
    'infant bomb people blur anger horror embrace twin base scout west scrub',
    'https://rinkeby.infura.io/v3/e2f4ae695414428f8eac050c116d858b'
    );
const ganache = require('ganache-cli');
const web3 = new Web3(provider);
let deployedContract;

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account: ', accounts[0]);
    deployedContract = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });

    console.log('Contract deployed to: ', deployedContract.options.address);
    deployedContract.setProvider(provider)
}

deploy();