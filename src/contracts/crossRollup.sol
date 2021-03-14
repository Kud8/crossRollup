pragma solidity 0.8.2;

struct ExchangeInfo {
    uint start;
    uint tradeValue;
}

contract CrossRollup {
    uint constant MIN_REDEMPTION_DELAY = 10;
    uint constant PROCESS_DELAY_HOURS = 24;
    uint constant FEE = 1;

    address public owner;
    address payable public receiver;
    uint public balance = 0;
    uint public start;

    mapping (address => ExchangeInfo) exchanges;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(address payable _receiver) public {
        owner = msg.sender;
        receiver = _receiver;
    }

    function deposit() external payable onlyOwner {
        balance += msg.value;
    }

    function requestExchange(address _destination) external payable {
        if (msg.sender == owner) {
            return;
        }
        // If previous request of requested destination isn't complete
        if (exchanges[_destination].tradeValue > 0) {
            return;
        }
        if (msg.value > 0 ) {
            exchanges[_destination] = ExchangeInfo({
                start: block.timestamp,
                tradeValue: msg.value
            });
        }
    }

    function completeExchange(address payable _destination) external payable onlyOwner {
        if (exchanges[_destination].tradeValue > 0) {
            return;
        }

        uint tradeValue = exchanges[_destination].tradeValue;
        uint start = exchanges[_destination].start;
        if (
            block.timestamp - start > (PROCESS_DELAY_HOURS * 1 hours) &&
            balance - tradeValue >= 0
        ) {
            _destination.transfer(tradeValue / (100 - FEE));
        }
    }

    function kill() external onlyOwner {
        selfdestruct(receiver);
    }
}
