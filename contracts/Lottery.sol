pragma solidity ^0.8.3;

contract Lottery {
    address public manager;
    address[] public players;
    address public winner;
    
    constructor() {
        manager = msg.sender;
    }
    
    modifier restrictToManager() {
        require(msg.sender == manager);
        _;
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function join() public payable {
        require(msg.value > .01 ether);
        players.push(msg.sender);
    }
    
    function getPlayers() public view returns (address[] memory) {
        return players;
    }
    
    function pickWinner() public restrictToManager {
        uint index = random() % players.length;
        address payable receiver = payable(players[index]);
        receiver.transfer(address(this).balance);
        winner = receiver;

        // reset players after picking a winner.
        players = new address[](0);
    }

    function getWinner() public view returns (address) {
        return winner;
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}