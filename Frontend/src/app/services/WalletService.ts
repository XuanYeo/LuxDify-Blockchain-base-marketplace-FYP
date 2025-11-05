import { ethers } from 'ethers';
import LDToken from '../../../../Backend/Backend_Contract/artifacts/contracts/LDToken.sol/LDToken.json'; // ✅ Make sure this path is correct

const TOKEN_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // ✅ Replace with latest LDToken address

class WalletService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    } catch (error) {
      console.error("❌ Failed to initialize provider:", error);
    }
  }

  public async connectWithPrivateKey(privateKey: string): Promise<{
    address: string;
    balance: string;
  } | null> {
    try {
      if (!this.provider) this.initializeProvider();
      if (!this.provider) throw new Error("Provider is not initialized");

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();

      // ✅ Fetch LDToken balance (instead of ETH)
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        LDToken.abi,
        this.provider
      );
      const rawBalance = await tokenContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(rawBalance, 18);

      return {
        address,
        balance: formattedBalance,
      };
    } catch (error) {
      console.error("❌ Failed to connect wallet:", error);
      return null;
    }
  }

  public async getLDTokenBalance(address: string): Promise<string> {
    try {
      if (!this.provider) this.initializeProvider();
      if (!this.provider) throw new Error("Provider is not initialized");

      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        LDToken.abi,
        this.provider
      );

      const rawBalance = await tokenContract.balanceOf(address);
      return ethers.formatUnits(rawBalance, 18);
    } catch (error) {
      console.error("❌ Failed to get LDToken balance:", error);
      return "0.0";
    }
  }

  public async sendTransaction(to: string, amount: string): Promise<any> {
    try {
      if (!this.wallet) throw new Error("Wallet not connected");

      const tx = await this.wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      return await tx.wait();
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      return null;
    }
  }

  public isConnected(): boolean {
    return this.wallet !== null;
  }

  public getAddress(): string | null {
    return this.wallet?.address || null;
  }
}

const walletService = new WalletService();
export default walletService;
