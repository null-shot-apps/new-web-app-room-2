import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Known exchange addresses
const EXCHANGE_ADDRESSES = new Set([
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 17
  '0x9696f59e4d72e237be84ffd425dcad154bf96976', // Binance 18
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67', // Binance 19
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance 20
  '0xf977814e90da44bfa03b6295a0616a897441acec', // Binance 8
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase 1
  '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase 2
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', // Coinbase 3
  '0x3cd751e6b0078be393132286c442345e5dc49699', // Coinbase 4
  '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511', // Coinbase 5
  '0xeb2629a2734e272bcc07bda959863f316f4bd4cf', // Coinbase 6
  '0xd688aea8f7d450909ade10c47faa95707ce0ce25', // Kraken 1
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13', // Kraken 2
  '0xe853c56864a2ebe4576a807d26fdc4a0ada51919', // Kraken 3
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken 4
  '0xfa52274dd61e1643d2205169732f29114bc240b3', // Kraken 5
  '0x1c4b70a3968436b9a0a9cf5205c787eb81bb558c', // Gate.io 1
  '0xd793281182a0e3e023116004778f45c29fc14f19', // Gate.io 2
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe', // Gate.io 3
]);

// ERC20 ABI for Transfer events
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { tokenAddress: string; whaleWallets: string[]; threshold: number };
    const { tokenAddress, whaleWallets, threshold } = body;

    if (!tokenAddress || !whaleWallets || whaleWallets.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Connect to Ethereum mainnet (using public RPC)
    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    
    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Get token info
    let decimals = 18;
    let symbol = 'TOKEN';
    try {
      decimals = await contract.decimals();
      symbol = await contract.symbol();
    } catch {
      console.log('Could not fetch token info, using defaults');
    }

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 100; // Check last ~20 minutes

    // Query Transfer events from whale wallets
    const transactions: any[] = [];

    for (const whaleWallet of whaleWallets) {
      try {
        const filter = contract.filters.Transfer(whaleWallet, null);
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        for (const event of events) {
          // Type guard to ensure we have an EventLog
          if (!('args' in event)) continue;
          
          const block = await event.getBlock();
          const value = ethers.formatUnits(event.args[2], decimals);
          const valueNum = parseFloat(value);

          // Simple price estimation (you'd want to use a price API in production)
          // For now, assume 1 token = $1 (this is just for demo)
          const valueUSD = valueNum * 1;

          // Check if above threshold
          if (valueUSD >= threshold) {
            const toAddress = (event.args[1] as string).toLowerCase();
            const isExchange = EXCHANGE_ADDRESSES.has(toAddress);

            transactions.push({
              hash: event.transactionHash,
              from: event.args[0] as string,
              to: event.args[1] as string,
              value: value,
              valueUSD: valueUSD,
              symbol: symbol,
              timestamp: block.timestamp,
              isExchange: isExchange,
              blockNumber: event.blockNumber,
            });
          }
        }
      } catch (error) {
        console.error(`Error querying events for ${whaleWallet}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      transactions: transactions,
      checkedBlock: currentBlock,
    });
  } catch (error: any) {
    console.error('Error in monitor API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}




