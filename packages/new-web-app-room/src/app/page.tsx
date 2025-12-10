'use client';

import { useState } from 'react';

export default function WhaleAlert() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [whaleWallets, setWhaleWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [threshold, setThreshold] = useState('500000');
  const [notificationChannel, setNotificationChannel] = useState<'telegram' | 'discord'>('telegram');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    whale: string;
    amount: string;
    destination: string;
    timestamp: Date;
    isExchange: boolean;
  }>>([]);

  const addWhaleWallet = () => {
    if (newWallet && !whaleWallets.includes(newWallet)) {
      setWhaleWallets([...whaleWallets, newWallet]);
      setNewWallet('');
    }
  };

  const removeWhaleWallet = (wallet: string) => {
    setWhaleWallets(whaleWallets.filter(w => w !== wallet));
  };

  const startMonitoring = () => {
    if (tokenAddress && whaleWallets.length > 0) {
      setIsMonitoring(true);
      // Simulate an alert for demo purposes
      setTimeout(() => {
        const mockAlert = {
          id: Date.now().toString(),
          whale: whaleWallets[0].substring(0, 10) + '...',
          amount: '$750,000',
          destination: 'Binance',
          timestamp: new Date(),
          isExchange: true
        };
        setAlerts([mockAlert, ...alerts]);
      }, 3000);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🐋 Whale Alert
          </h1>
          <p className="text-xl text-gray-300">
            Real-Time Crypto Protection System
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Get instant alerts when whales move tokens to exchanges
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-6">Setup Monitoring</h2>
            
            {/* Token Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Token Contract Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Whale Wallets */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Whale Wallets to Monitor</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="Wallet address..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={addWhaleWallet}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              
              {/* Wallet List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {whaleWallets.map((wallet) => (
                  <div key={wallet} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg">
                    <span className="text-sm font-mono truncate">{wallet}</span>
                    <button
                      onClick={() => removeWhaleWallet(wallet)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Threshold */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Alert Threshold (USD)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="500000"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">Only alert for transactions above this amount</p>
            </div>

            {/* Notification Channel */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Notification Channel</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setNotificationChannel('telegram')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    notificationChannel === 'telegram'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  📱 Telegram
                </button>
                <button
                  onClick={() => setNotificationChannel('discord')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    notificationChannel === 'discord'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  💬 Discord
                </button>
              </div>
            </div>

            {/* Start/Stop Button */}
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={!tokenAddress || whaleWallets.length === 0}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                isMonitoring
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed'
              }`}
            >
              {isMonitoring ? '⏸ Stop Monitoring' : '▶ Start Monitoring'}
            </button>
          </div>

          {/* Alerts Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Live Alerts</h2>
              {isMonitoring && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Monitoring Active</span>
                </div>
              )}
            </div>

            {/* Alert List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">👀</div>
                  <p>No alerts yet</p>
                  <p className="text-sm mt-2">Start monitoring to receive whale movement alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${
                      alert.isExchange
                        ? 'bg-red-500/20 border-red-500'
                        : 'bg-yellow-500/20 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {alert.isExchange ? (
                          <span className="text-2xl">🚨</span>
                        ) : (
                          <span className="text-2xl">⚠️</span>
                        )}
                        <span className="font-bold">
                          {alert.isExchange ? 'EXCHANGE DEPOSIT' : 'WHALE MOVEMENT'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-300">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Whale:</span> {alert.whale}</p>
                      <p><span className="text-gray-400">Amount:</span> <span className="font-bold">{alert.amount}</span></p>
                      <p><span className="text-gray-400">Destination:</span> {alert.destination}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold">{whaleWallets.length}</div>
            <div className="text-sm text-gray-400">Whales Monitored</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">🔔</div>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="text-sm text-gray-400">Total Alerts</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">${threshold.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Alert Threshold</div>
          </div>
        </div>
      </div>
    </div>
  );
}

