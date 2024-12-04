const { network } = require("hardhat");
const {
  DECIMAL,
  INITIAL_ANSWER,
  devlopmentChains,
} = require("../helper-hardhat-config");
module.exports = async ({ getNamedAccounts, deployments }) => {
    console.log(devlopmentChains)
  if (devlopmentChains.includes(network.name)) {
    const { firstAccount } = await getNamedAccounts();
    const { deploy } = deployments;
    console.log("this is deploy function", firstAccount);

    await deploy("MockV3Aggregator", {
      from: firstAccount,
      args: [DECIMAL, INITIAL_ANSWER],
      log: true,
    });
  } else {
    console.log("nevironment is not local,mock contract deployment si skipped");
  }
};

module.exports.tags = ["all", "mock"];
