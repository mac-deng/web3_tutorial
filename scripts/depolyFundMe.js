//import ethers.js
//create main function
//execute main function 
const {ethers} = require("hardhat");

async function main(){
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    // depoly contract from factory
    const fundMe = await fundMeFactory.deploy(10);
    await fundMe.waitForDeployment();
    console.log(`contract has been depolyed sucessfully, contract address is ${fundMe.target}`);

    await fundMe.deploymentTransaction().wait();
    console.log(`Waiting for 5 confirmations. `);

    verifyFundme(fundMe.target,[10])

}

async function verifyFundme(fundMeAddr, args){
    await hre.run("verify:verify",{
        address:fundMeAddr,
        constructorArguments:args,
    })

}

main().then().catch((error)=>{
    console.error(error);
    process.exit(0);//正常退出进程
    //process.exit(1);//强制退出进程

});