const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { devlopmentChains } = require("../../helper-hardhat-config");

devlopmentChains.includes(network.name)
  ? describe.skip
  : describe("test fundme contract", async function () {
      let fundMe;
      let firstAccount;

      beforeEach(async function () {
        await deployments.fixture(["all"]); //部署对应组内合约
        firstAccount = (await getNamedAccounts()).firstAccount; //一个账号
        const fundMeDeployMent = await deployments.get("FundMe"); //获取到已部署的合约
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployMent.address); //合约工厂
      });

      // test fund and getFund successfuly
      it("fund and getFund successfuly", async function () {
        //make sure target reached
        await fundMe.fund({ value: ethers.parseEther("0.5") }); //3000*0.5 = 1500
        //make sure window closed
        await new Promise((res) => setTimeout(res, 181 * 1000));

        //make sure we can get receipt
        const getFundTx = await fundMe.getFund();
        const getFundReceipt = await getFundTx.wait(); //因为网络原因，等待回执信息

        await expect(getFundReceipt)
          .to.emit(fundMe, "FundWithdrawByOwner") //触发了该事件
          .withArgs(ethers.parseEther("0.5")); //获得了1个eth
      });
      // test fund and refund successfuly
      it("fund and refund successfuly", async function () {
        //make sure target reached
        await fundMe.fund({ value: ethers.parseEther("0.1") }); //3000*0.1 =300
        //make sure window closed
        await new Promise((res) => setTimeout(res, 181 * 1000));

        //make sure we can get receipt
        const getFundTx = await fundMe.refund();
        const getFundReceipt = await getFundTx.wait(); //因为网络原因，等待回执信息

        await expect(getFundReceipt)
          .to.emit(fundMe, "RefundByFunder") //触发了该事件
          .withArgs(firstAccount, ethers.parseEther("0.1")); //获得了1个eth
      });
    });
