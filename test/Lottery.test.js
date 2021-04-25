const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiled_contract = require('../compile');
const bytecode = compiled_contract.evm.bytecode.object;
const abi = compiled_contract.abi;
let accounts;
let lottery;
let manager;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi)
                    .deploy({ data: bytecode })
                    .send({ from: accounts[0], gas:'1000000' });
    manager = accounts[0];
})

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    });

    it('join one player to the lottery when minimum money is paid', async () => {
        const player = accounts[0];
        await lottery.methods.join().send({ 
            from: player, 
            value: web3.utils.toWei('0.02', 'ether') });
        const playersList = await lottery.methods.getPlayers().call({
            from: manager
        });
        assert.strictEqual(1, playersList.length);
        assert.strictEqual(player, playersList[0]);
    })

    it('join multiple players to the lottery when minimum money is paid', async () => {
        const player1 = accounts[1];
        const player2 = accounts[2];

        await lottery.methods.join().send({ 
            from: player1, 
            value: web3.utils.toWei('0.02', 'ether') });
        
        await lottery.methods.join().send({ 
            from: player2, 
            value: web3.utils.toWei('0.02', 'ether') });
            
        const playersList = await lottery.methods.getPlayers().call({
            from: manager
        });
        assert.strictEqual(2, playersList.length);
        assert.strictEqual(player1, playersList[0]);
        assert.strictEqual(player2, playersList[1]);
    })

    it('refuse joining player to the lottery when minimum amount is not paid', async () => {
        const player = accounts[0];
        let error;
        try {
            await lottery.methods.join().send({ 
                from: player, 
                value: '10' });
        } catch (err) {
            error = err;
        }
        const playersList = await lottery.methods.getPlayers().call({
            from: manager
        });
        assert(error);
        assert.strictEqual(0, playersList.length);
    })

    it('only manager should be allowed to pick winner', async () => {
        let error;
        try {
            await lottery.methods.pickWinner().call({
                from: accounts[1]
            });
        } catch (err) {
            error = err
        }
        assert(error);
    })

    it('manager picks a winner, winner receives money and playesrs list get reset', async () => {
        const player1 = accounts[1];
        const player2 = accounts[2];

        await lottery.methods.join().send({ 
            from: player1, 
            value: web3.utils.toWei('0.02', 'ether') });
        const player1InitialBalance = await web3.eth.getBalance(player1);
        
        await lottery.methods.join().send({ 
            from: player2, 
            value: web3.utils.toWei('0.02', 'ether') });
        const player2InitialBalance = await web3.eth.getBalance(player2);

        lotteryBalance = await web3.eth.getBalance(lottery.options.address);
        // console.log(player1InitialBalance, player2InitialBalance, lotteryBalance);

        // ensure players are added to the lottery
        const playersListBeforePickingWinner = await lottery.methods.getPlayers().call({
            from: manager
        });
        assert.strictEqual(2, playersListBeforePickingWinner.length);
        assert.strictEqual(player1, playersListBeforePickingWinner[0]);
        assert.strictEqual(player2, playersListBeforePickingWinner[1]);

        // no winner untill picked
        let winner = await lottery.methods.getWinner().call();
        assert.strictEqual(winner, '0x0000000000000000000000000000000000000000');

        // pick a winner
        await lottery.methods.pickWinner().send({
            from: manager
        });
        winner = await lottery.methods.getWinner().call();
        assert(winner);
        let winningPlayer;
        let winningPlayerFinalBalance;
        let difference;
        if (winner == player1) {
            console.log('Player1 wins');
            winningPlayer = player1;
            winningPlayerFinalBalance = await web3.eth.getBalance(winningPlayer);
            difference = winningPlayerFinalBalance - player1InitialBalance;
        } else {
            console.log('Player2 wins');
            winningPlayer = player2;
            winningPlayerFinalBalance = await web3.eth.getBalance(winningPlayer);
            difference = winningPlayerFinalBalance - player2InitialBalance;
        }
        
        // console.log(difference);
        // winning price should be equal to lottery balance
        assert.strictEqual(difference.toString(), lotteryBalance);

        // contract balance should become zero after picking winner
        lotteryBalanceAfterPickingWinner = await web3.eth.getBalance(lottery.options.address);
        assert.strictEqual('0', lotteryBalanceAfterPickingWinner);
        
        // list of players should reset after picking a winner
        const playersListAfterPickingWinner = await lottery.methods.getPlayers().call({
            from: manager
        });
        assert.strictEqual(0, playersListAfterPickingWinner.length);
    })
});