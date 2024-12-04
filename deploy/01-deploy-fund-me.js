const { network } = require("hardhat");
const {
  devlopmentChains,
  networkConfig,
  LOCK_TIME,
  COMFIRMATIONS,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy } = deployments;
  console.log("this is deploy function", firstAccount);

  let dataFeedAddr;
  let confirmations;
  if (devlopmentChains.includes(network.name)) {
    const MockV3Aggregator = await deployments.get("MockV3Aggregator");
    dataFeedAddr = MockV3Aggregator.address;
    confirmations =0;
  } else {
    dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed;
    confirmations=COMFIRMATIONS
  }

  const FundMe = await deploy("FundMe", {
    from: firstAccount,//操作账户
    args: [LOCK_TIME, dataFeedAddr],//合约参数
    log: true,//日志
    waitConfirmations:confirmations,//等待5个区块
  });
  //remove devlopments directory or add --reset flag if you redepoly contract

  // verify fundme
  if (hre.network.config.chainId == 11155111 && process.env.SEPOLIA_APIKEY) {
    await hre.run("verify:verify", {
      address: FundMe.address,
      constructorArguments: [LOCK_TIME, dataFeedAddr],
    });
  } else {
    console.log("verification skipped..");
  }
};

module.exports.tags = ["all", "fundme"];
