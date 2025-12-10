import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Known exchange addresses (major exchanges)
const EXCHANGE_ADDRESSES = new Set([
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 17
  '0x9696f59e4d72e237be84ffd425dcad154bf96976', // Binance 18
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67', // Binance 19
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance 20
  '0xf977814e90da44bfa03b6295a0616a897441acec', // Binance 8
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance
  '0xd551234ae421e3bcba99a0da6d736074f22192ff', // Binance 2
  '0x564286362092d8e7936f0549571a803b203aaced', // Binance 3
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf', // Binance 4
  '0xfe9e8709d3215310075d67e3ed32a380ccf451c8', // Binance 5
  '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36', // Binance 7
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase 1
  '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase 2
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', // Coinbase 3
  '0x3cd751e6b0078be393132286c442345e5dc49699', // Coinbase 4
  '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511', // Coinbase 5
  '0xeb2629a2734e272bcc07bda959863f316f4bd4cf', // Coinbase 6
  '0xd688aea8f7d450909ade10c47faa95707ce0ce25', // Coinbase 7
  '0x02466e547bfdab679fc49e96bbfc62b9747d997c', // Kraken 1
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13', // Kraken 2
  '0xe853c56864a2ebe4576a807d26fdc4a0ada51919', // Kraken 3
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken 4
  '0xfa52274dd61e1643d2205169732f29114bc240b3', // Kraken 5
  '0x53d284357ec70ce289d6d64134dfac8e511c8a3d', // Kraken 6
  '0x89e51fa8ca5d66cd220baed62ed01e8951aa7c40', // Kraken 7
  '0xae2d4617c862309a3d75a0ffb358c7a5009c673f', // Kraken 8
  '0x43984d578803891dfa9706bdeee6078d80cfc79e', // Kraken 9
  '0x66c57bf505a85a74609d2c83e94aabb26d691e1f', // Kraken 10
  '0xda9dfa130df4de4673b89022ee50ff26f6ea73cf', // Kraken 11
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken 12
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe', // Gate.io 1
  '0x1c4b70a3968436b9a0a9cf5205c787eb81bb558c', // Gate.io 2
  '0xd793281182a0e3e023116004778f45c29fc14f19', // Gate.io 3
  '0x7793cd85c11a924478d358d49b05b37e91b5810f', // Gate.io 4
  '0x1b6c5864375b34af3ff5bd2e5f40bc425b4a8d79', // Gate.io 5
]);

// In-memory storage for monitoring sessions
const monitoringSessions = new Map<string, {
  provider: ethers.JsonRpcProvider;
  tokenAddress: string;
  whaleWallets: string[];
  threshold: number;
  email: string;
  lastBlock: number;
}>();

interface MonitorRequest {
  action: 'start' | 'stop' | 'check';
  sessionId: string;
  tokenAddress?: string;
  whaleWallets?: string[];
  threshold?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MonitorRequest;
    const { action, sessionId, tokenAddress, whaleWallets, threshold, email } = body;

    if (action === 'start') {
      // Validate required fields
      if (!tokenAddress || !whaleWallets || !threshold || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Initialize Ethereum provider (using public RPC)
      const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      
      // Validate token address
      if (!ethers.isAddress(tokenAddress)) {
        return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
      }

      // Validate whale wallets
      for (const wallet of whaleWallets) {
        if (!ethers.isAddress(wallet)) {
          return NextResponse.json({ error: `Invalid wallet address: ${wallet}` }, { status: 400 });
        }
      }

      const currentBlock = await provider.getBlockNumber();
      
      // Store monitoring session
      monitoringSessions.set(sessionId, {
        provider,
        tokenAddress,
        whaleWallets: whaleWallets.map((w: string) => w.toLowerCase()),
        threshold: parseFloat(threshold),
        email,
        lastBlock: currentBlock,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Monitoring started',
        currentBlock 
      });
    }

    if (action === 'stop') {
      monitoringSessions.delete(sessionId);
      return NextResponse.json({ success: true, message: 'Monitoring stopped' });
    }

    if (action === 'check') {
      const session = monitoringSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ alerts: [] });
      }

      const alerts = await checkTransactions(session);
      
      // Update last checked block
      const currentBlock = await session.provider.getBlockNumber();
      session.lastBlock = currentBlock;

      return NextResponse.json({ alerts });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function checkTransactions(session: {
  provider: ethers.JsonRpcProvider;
  tokenAddress: string;
  whaleWallets: string[];
  threshold: number;
  email: string;
  lastBlock: number;
}) {
  const alerts = [];
  const currentBlock = await session.provider.getBlockNumber();
  
  // ERC20 Transfer event signature
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  
  // Check last 10 blocks for transfers
  const fromBlock = Math.max(session.lastBlock - 10, currentBlock - 100);
  
  try {
    const logs = await session.provider.getLogs({
      address: session.tokenAddress,
      topics: [transferTopic],
      fromBlock,
      toBlock: currentBlock,
    });

    for (const log of logs) {
      if (log.topics.length < 3) continue;
      
      const from = ethers.getAddress('0x' + log.topics[1].slice(26));
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));
      
      // Check if sender is a monitored whale
      if (session.whaleWallets.includes(from.toLowerCase())) {
        const amount = ethers.toBigInt(log.data);
        
        // Get token decimals (assume 18 for now, could be improved)
        const decimals = 18;
        const amountFormatted = parseFloat(ethers.formatUnits(amount, decimals));
        
        // Check if amount exceeds threshold (simplified - would need price oracle in production)
        const estimatedValue = amountFormatted * 1; // Placeholder: would need real price
        
        if (estimatedValue > session.threshold) {
          const isExchange = EXCHANGE_ADDRESSES.has(to.toLowerCase());
          
          alerts.push({
            id: log.transactionHash,
            whale: from,
            to,
            amount: amountFormatted.toFixed(4),
            estimatedValue: `$${estimatedValue.toLocaleString()}`,
            destination: isExchange ? getExchangeName(to) : 'Unknown Wallet',
            isExchange,
            timestamp: new Date().toISOString(),
            txHash: log.transactionHash,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking transactions:', error);
  }

  return alerts;
}

function getExchangeName(address: string): string {
  const addr = address.toLowerCase();
  if (addr.startsWith('0x28c6c06298d514db089934071355e5743bf21d60') || 
      addr.startsWith('0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be') ||
      addr.startsWith('0xf977814e90da44bfa03b6295a0616a897441acec')) {
    return 'Binance';
  }
  if (addr.startsWith('0x71660c4005ba85c37ccec55d0c4493e66fe775d3') ||
      addr.startsWith('0x503828976d22510aad0201ac7ec88293211d23da')) {
    return 'Coinbase';
  }
  if (addr.startsWith('0x02466e547bfdab679fc49e96bbfc62b9747d997c') ||
      addr.startsWith('0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13')) {
    return 'Kraken';
  }
  if (addr.startsWith('0x0d0707963952f2fba59dd06f2b425ace40b492fe') ||
      addr.startsWith('0x1c4b70a3968436b9a0a9cf5205c787eb81bb558c')) {
    return 'Gate.io';
  }
  return 'Exchange';
}



