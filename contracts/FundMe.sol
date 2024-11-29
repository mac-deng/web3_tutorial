// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

//1. 创建收款函数
//2. 记录投资人并查看
//3. 锁定期内，达到目标值，生产商可以提款
//4. 锁定期内，没有达到目标值，投资人可以在锁定期外退款

contract FundMe {
    mapping(address => uint256) public fundersToAmount;

    uint256 constant MINIMUM_VALUE = 1 * 10**18; //wei

    AggregatorV3Interface internal dataFeed;

    uint256 constant TARGET = 1000 * 10**18;
    address public owner;

    uint256 deploymentTimestamp;
    uint256 lockTime;

    address erc20Addr;

    bool public getFundSuccess = false;

    constructor(uint256 _lockTime) {
        // sepolia testnet
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH.");
        require(
            block.timestamp < deploymentTimestamp + lockTime,
            "window is closed"
        );
        fundersToAmount[msg.sender] = msg.value;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function setErc20Addr(address _erc20Addr) public ownerOnly {
        erc20Addr = _erc20Addr;
    }

    function setFunderToAmout(address funder, uint256 amountToUpdate) external {
        require(
            erc20Addr == msg.sender,
            "You do not have permession to call this function ."
        );
        fundersToAmount[funder] = amountToUpdate;
    }

    function convertEthToUsd(uint256 ethAmount)
        internal
        view
        returns (uint256)
    {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ethAmount * ethPrice) / (10**8);
    }

    function transferOwnership(address newOwner) public ownerOnly {
        owner = newOwner;
    }

    function getFund() external windowClosed ownerOnly {
        require(
            convertEthToUsd(address(this).balance) >= TARGET,
            "Target is not reached."
        );

        // payable(msg.sender).transfer(address(this).balance);
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(success, "tx failed");
        // fundersToAmount[msg.sender] = 0;

        getFundSuccess = true;
    }

    function refund() external windowClosed {
        require(
            convertEthToUsd(address(this).balance) < TARGET,
            "Target is reached."
        );
        require(fundersToAmount[msg.sender] != 0, "There is no fund for you.");

        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(success, "tx failed");
        fundersToAmount[msg.sender] = 0;
    }

    modifier windowClosed() {
        require(
            block.timestamp >= deploymentTimestamp + lockTime,
            "window is not closed"
        );
        _;
    }

    modifier ownerOnly() {
        require(msg.sender == owner, "this function can only called by owner.");
        _;
    }
}
