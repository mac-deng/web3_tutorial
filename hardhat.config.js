require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
require("./tasks")
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

const SEPOLIA_URL = process.env.SEPOLIA_URL;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const SEPOLIA_PRIVATE_KEY_1 = process.env.SEPOLIA_PRIVATE_KEY_1;
const SEPOLIA_APIKEY = process.env.SEPOLIA_APIKEY;
//export https_proxy=http://127.0.0.1:7899 http_proxy=http://127.0.0.1:7897 all_proxy=socks5://127.0.0.1:7898
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  defaultNetwork:"hardhat",
  mocha:{
    timeout:300000
  },
  etherscan: {
    apiKey: {
      sepolia:SEPOLIA_APIKEY
    },
  },
  // sourcify: {
  //   enabled: false,
  // },
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [SEPOLIA_PRIVATE_KEY, SEPOLIA_PRIVATE_KEY_1],
      chainId: 11155111,
    },
  },
  namedAccounts:{
    firstAccount:{
      default:0
    },
    secondAccount:{
      default:1
    }
  },gasReporter:{
    enabled:true
  }
};
