const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { devlopmentChains } = require("../../helper-hardhat-config");

!devlopmentChains.includes(network.name)
  ? describe.skip
  : describe("test fundme contract", async function () {
      let fundMe;
      let firstAccount;
      let secondAccount;
      let fundMeSecondAccount;
      let mockV3Aggregator;

      beforeEach(async function () {
        await deployments.fixture(["all"]); //部署对应组内合约
        firstAccount = (await getNamedAccounts()).firstAccount; //一个账号
        secondAccount = (await getNamedAccounts()).secondAccount; //第二个账号
        const fundMeDeployMent = await deployments.get("FundMe"); //获取到已部署的合约
        mockV3Aggregator = await deployments.get("MockV3Aggregator");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployMent.address); //合约工厂
        fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount);
      });

      it("test if the owner is msg.sender", async function () {
        await fundMe.waitForDeployment();
        assert.equal(await fundMe.owner(), firstAccount);
      });

      it("test if the datafeed is assigned correctly", async function () {
        await fundMe.waitForDeployment();
        assert.equal(await fundMe.dataFeed(), mockV3Aggregator.address);
      });

      //fund , getFund, refund
      //uint test for fund
      //window open , value greater then minimum value , funder balance
      it("window closed, value grater than minimum, fund failed", async function () {
        //make sure the window is closed
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交
        expect(
          fundMe.fund({ value: ethers.parseEther("0.1") })
        ).to.be.rejectedWith("window is closed"); //wei 单位
      });

      it("window open, value is less than minimum, fund failed", async function () {
        expect(
          fundMe.fund({ value: ethers.parseEther("0.01") })
        ).to.be.rejectedWith("Send more ETH."); //wei 单位
      });

      it("window close, value is greater minimum, fund success", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        const balance = await fundMe.fundersToAmount(firstAccount);
        expect(balance).to.equal(ethers.parseEther("0.1"));
        // await helpers.time.increase(200); //增加200秒
        // await helpers.mine(); //模拟挖矿成交
      });

      //uint test for getFund
      //onlyOwner, windowClose, target reached
      it("not owner, window closed, target reached, getFund failed", async function () {
        //make sure the target is reached
        await fundMe.fund({ value: ethers.parseEther("1") });

        //make sure the window is closed
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交

        await expect(fundMeSecondAccount.getFund()).to.be.revertedWith(
          "this function can only called by owner."
        );
      });

      it("window open,target reached, getFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await expect(fundMe.getFund()).to.be.revertedWith(
          "window is not closed"
        );
      });

      it("window closed,target not reached, getFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        //make sure the window is closed
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交

        await expect(fundMe.getFund()).to.be.revertedWith(
          "Target is not reached."
        );
      });

      it("window closed, target reached, getFund success", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        //make sure the window is closed
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交

        await expect(fundMe.getFund())
          .to.emit(fundMe, "FundWithdrawByOwner") //触发了该事件
          .withArgs(ethers.parseEther("1")); //获得了1个eth
      });

      it("window open, target not reached, funder has balance", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await expect(fundMe.refund()).to.be.revertedWith(
          "window is not closed"
        );
      });

      it("window closed, target not reached, funder has balance", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交
        await expect(fundMe.refund()).to.be.revertedWith("Target is reached.");
      });

      it("window closed, target not reached, funder does not has balance", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交
        await expect(fundMeSecondAccount.refund()).to.be.revertedWith(
          "There is no fund for you."
        );
      });

      it("window closed, target not reached, funder has balance", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200); //增加200秒
        await helpers.mine(); //模拟挖矿成交
        await expect(fundMe.refund())
          .to.emit(fundMe, "RefundByFunder") //触发了该事件
          .withArgs(firstAccount, ethers.parseEther("0.1")); //获得了0.1个eth
      });
    });
