const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Data store", async (accounts) => {
    describe("Should attach to security token securely", async () => { 
        it("Should be attached to a security token upon deployment", async () => {
            
        });

        it("Should not allow non-issuer to change security token address", async () => {
            
        });

        it("Should not allow DATA module to change security token address", async () => {
            
        });

        it("Should allow issuer to change security token address", async () => {
            
        });
    });

    describe("Should not allow unautohrized modification to data", async () => {
        it("Should not allow random addresses to modify data", async () => {
            
        });

        it("Should not allow modules that does not belong to DATA type to modify data", async () => {
            
        });

        it("Should not allow archived modules to modify data", async () => {
            
        });
    });

    describe("Should set data correctly", async () => {
        it("Should set uint256 correctly", async () => {

        });

        it("Should set bytes32 correctly", async () => {
            
        });

        it("Should set address correctly", async () => {
            
        });

        it("Should set string correctly", async () => {
            
        });

        it("Should set bytes correctly", async () => {
            
        });

        it("Should set bool correctly", async () => {
            
        });

        it("Should set uint256 array correctly", async () => {

        });

        it("Should set bytes32 array correctly", async () => {
            
        });

        it("Should set address array correctly", async () => {
            
        });

        it("Should set bool array correctly", async () => {
            
        });
    });    

    describe("Should fetch data correctly", async () => {
        it("Should fetch uint256 correctly", async () => {

        });

        it("Should fetch bytes32 correctly", async () => {
            
        });

        it("Should fetch address correctly", async () => {
            
        });

        it("Should fetch string correctly", async () => {
            
        });

        it("Should fetch bytes correctly", async () => {
            
        });

        it("Should fetch bool correctly", async () => {
            
        });

        it("Should fetch uint256 array correctly", async () => {

        });

        it("Should fetch bytes32 array correctly", async () => {
            
        });

        it("Should fetch address array correctly", async () => {
            
        });

        it("Should fetch bool array correctly", async () => {
            
        });
    });
});