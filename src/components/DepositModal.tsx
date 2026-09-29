import React, { useState } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Coins, 
  CheckCircle2, 
  Smartphone, 
  Wallet, 
  ArrowRightLeft, 
  ExternalLink, 
  Info,
  Sparkles,
  AlertCircle,
  Loader2,
  Zap,
  Globe
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { safeCopyText } from '../utils/storage';
import { PlatformContacts, UserProfile } from '../types';
import { api } from '../services/api';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeposit: (amount: number, currency: 'USDT' | 'BTC' | 'ETH' | 'KES', txHash: string, method: string) => void;
  onOpenMpesa?: () => void;
  contacts?: PlatformContacts;
  user?: UserProfile;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeposit,
  onOpenMpesa,
  contacts,
  user
}) => {
  const [selectedAsset, setSelectedAsset] = useState<'USDT_BEP20' | 'BTC' | 'KES_MPESA'>('USDT_BEP20');
  const [depositAmountKES, setDepositAmountKES] = useState<number>(13000);
  const [senderWalletAddress, setSenderWalletAddress] = useState<string>('');
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isWeb3Connecting, setIsWeb3Connecting] = useState<boolean>(false);
  const [successStep, setSuccessStep] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<string>('');
  const [lastExplorerUrl, setLastExplorerUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [txVerificationStatus, setTxVerificationStatus] = useState<string>('');

  if (!isOpen) return null;

  const exchangeRate = contacts?.kesUsdExchangeRate || 130.00; // 1 USD = 130 KES
  const btcRateKES = 12480000;

  // Master Receiving Vault Addresses (Real Owner Addresses)
  const depositAddresses: Record<string, { address: string; network: string; explorerUrl: string; memo?: string }> = {
    USDT_BEP20: {
      address: contacts?.cryptoDepositWallets?.usdtBep20 || '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
      network: 'BNB Smart Chain (BEP-20)',
      explorerUrl: `https://bscscan.com/address/${contacts?.cryptoDepositWallets?.usdtBep20 || '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff'}`
    },
    BTC: {
      address: contacts?.cryptoDepositWallets?.btc || '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU',
      network: 'Bitcoin Native (BTC)',
      explorerUrl: `https://blockstream.info/address/${contacts?.cryptoDepositWallets?.btc || '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU'}`
    },
    KES_MPESA: {
      address: 'Till 1722023 (Smartchoice Ventures)',
      network: 'Safaricom M-PESA Buy Goods Till',
      explorerUrl: ''
    }
  };

  const activeAssetInfo = depositAddresses[selectedAsset] || depositAddresses.USDT_BEP20;
  const activeAddress = activeAssetInfo.address;

  // Real Scannable QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(activeAddress)}`;

  // Calculate crypto equivalent
  const getCryptoEquivalent = () => {
    if (selectedAsset.includes('USDT')) {
      const usdt = depositAmountKES / exchangeRate;
      return `${usdt.toFixed(2)} USDT`;
    }
    if (selectedAsset === 'BTC') {
      const btc = depositAmountKES / btcRateKES;
      return `${btc.toFixed(6)} BTC`;
    }
    return `Ksh ${depositAmountKES.toLocaleString()}`;
  };

  const handleCopy = () => {
    safeCopyText(activeAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // 1. Direct Web3 Transfer via MetaMask / Trust Wallet (Real on-chain transfer to 0xbcf65f39cd5868e8ac571c6d929255dd587f9bff)
  const handleWeb3DirectTransfer = async () => {
    setErrorMessage('');
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setErrorMessage('No Web3 wallet detected in browser. Please open in MetaMask, Trust Wallet, or transfer manually from Binance/Bybit.');
      return;
    }

    setIsWeb3Connecting(true);

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setErrorMessage('Wallet connection declined.');
        setIsWeb3Connecting(false);
        return;
      }
      const userAddress = accounts[0];

      // Ensure network is BSC (Chain ID 0x38 = 56)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }]
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com']
            }]
          });
        } else {
          throw switchError;
        }
      }

      // USDT BEP-20 Contract on BSC: 0x55d398326f99059fF775485246999027B3197955
      const usdtContract = '0x55d398326f99059fF775485246999027B3197955';
      const usdtAmount = depositAmountKES / exchangeRate;
      
      // transfer(address to, uint256 amount)
      // Function signature: 0xa9059cbb
      const targetAddress = activeAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      // USDT has 18 decimals on BSC
      const amountHex = BigInt(Math.floor(usdtAmount * 1e18)).toString(16).padStart(64, '0');
      const dataPayload = `0xa9059cbb${targetAddress}${amountHex}`;

      // Prompt user to sign and broadcast transaction
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: usdtContract,
          data: dataPayload,
          value: '0x0'
        }]
      });

      if (!txHash) {
        throw new Error('Transaction was cancelled or declined.');
      }

      const explorerLink = `https://bscscan.com/tx/${txHash}`;
      setLastExplorerUrl(explorerLink);
      setLastReceipt(txHash);

      // Call backend to credit wallet
      const res = await api.deposit({
        email: user?.email,
        userId: user?.id,
        amountKES: depositAmountKES,
        currency: 'USDT',
        method: `Web3 Direct Transfer (BSC) from ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
        txHash,
        customerName: user?.fullName,
        phone: user?.phone || user?.mpesaNumber,
        isWeb3Direct: true
      });

      setIsWeb3Connecting(false);
      if (res.success) {
        setSuccessStep(true);
        triggerConfetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        onConfirmDeposit(depositAmountKES, 'USDT', txHash, 'Web3 Direct Transfer (BSC)');
      } else {
        setErrorMessage(res.error || 'Failed to record deposit');
      }
    } catch (err: any) {
      setIsWeb3Connecting(false);
      setErrorMessage(err?.message || 'Web3 transaction failed or was rejected in wallet.');
    }
  };

  // 2. Manual Blockchain Transfer Verification (from Binance, Bybit, Trust Wallet app)
  const handleVerifyManualTx = async () => {
    setErrorMessage('');
    const cleanHash = txHashInput.trim();

    if (!cleanHash) {
      setErrorMessage('Please enter the blockchain Transaction Hash (TxID) from your wallet or exchange transfer.');
      return;
    }

    if (selectedAsset === 'USDT_BEP20' && (!cleanHash.startsWith('0x') || cleanHash.length !== 66)) {
      setErrorMessage('Invalid BSC transaction hash. A valid BEP-20 hash starts with 0x and is 66 characters long.');
      return;
    }

    if (selectedAsset === 'BTC' && cleanHash.length !== 64) {
      setErrorMessage('Invalid Bitcoin transaction hash. A valid Bitcoin TxID is 64 hexadecimal characters.');
      return;
    }

    setIsProcessing(true);
    setTxVerificationStatus('Connecting to blockchain RPC to verify on-chain transaction...');

    try {
      const curr = selectedAsset === 'BTC' ? 'BTC' : 'USDT';
      
      // Verify with blockchain node
      const verifyRes = await api.verifyBlockchainTx(cleanHash, curr);
      if (!verifyRes.success) {
        setIsProcessing(false);
        setErrorMessage(verifyRes.error || 'Could not verify blockchain transaction.');
        return;
      }

      const explorerLink = verifyRes.explorerUrl || (
        curr === 'BTC' ? `https://blockstream.info/tx/${cleanHash}` : `https://bscscan.com/tx/${cleanHash}`
      );
      setLastExplorerUrl(explorerLink);

      // Submit verified deposit to backend
      const res = await api.deposit({
        email: user?.email,
        userId: user?.id,
        amountKES: depositAmountKES,
        currency: curr,
        method: `Blockchain Transfer (${activeAssetInfo.network})${senderWalletAddress.trim() ? ` from ${senderWalletAddress.slice(0, 6)}...${senderWalletAddress.slice(-4)}` : ''}`,
        txHash: cleanHash,
        customerName: user?.fullName,
        phone: user?.phone || user?.mpesaNumber
      });

      setIsProcessing(false);

      if (res.success) {
        setLastReceipt(cleanHash);
        setSuccessStep(true);
        triggerConfetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        onConfirmDeposit(depositAmountKES, curr as any, cleanHash, activeAssetInfo.network);
      } else {
        setErrorMessage(res.error || 'Failed to register blockchain transaction.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Network error verifying blockchain transaction.');
    }
  };

  const handleCloseModal = () => {
    setSuccessStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="bg-black border border-amber-500/40 rounded-none max-w-lg w-full text-white shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="shrink-0 bg-[#080808] p-5 sm:p-6 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading uppercase tracking-wide">Deposit Investment Capital</h2>
                <span className="text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 uppercase tracking-wider">
                  Live Vault
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct On-Chain Blockchain Settlement & M-PESA Till</p>
            </div>
          </div>

          <button 
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white p-2 rounded-none border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain bg-black">
          
          {/* SUCCESS SCREEN */}
          {successStep ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-none bg-emerald-950/80 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-none inline-block mb-2">
                  ✓ On-Chain Deposit Confirmed
                </span>
                <h3 className="text-2xl font-black text-white font-heading">
                  Ksh {depositAmountKES.toLocaleString()}
                </h3>
                <p className="text-xs text-amber-300 font-mono mt-1 font-bold">
                  {getCryptoEquivalent()} credited to available balance
                </p>
              </div>

              <div className="p-4 bg-[#080808] border border-slate-800 rounded-none text-left space-y-2.5 max-w-sm mx-auto font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Network:</span>
                  <span className="text-white font-bold">{activeAssetInfo.network}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Receiving Vault:</span>
                  <span className="text-amber-300 font-bold truncate max-w-[180px]">{activeAddress}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>TxID / Hash:</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[180px]">{lastReceipt}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">ON-CHAIN CONFIRMED</span>
                </div>

                {lastExplorerUrl && (
                  <div className="pt-2 border-t border-slate-800">
                    <a
                      href={lastExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1.5 text-[11px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Transaction on Blockchain Explorer</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-none uppercase tracking-wider text-xs transition-all cursor-pointer shadow-lg active:scale-98"
                >
                  Done • View Updated Balance
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-200 rounded-none flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Payment Rail Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">Select Payment Rail</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'USDT_BEP20', label: 'USDT (BEP-20)', sub: 'BNB Smart Chain • Low Fee', icon: '⚡' },
                    { id: 'BTC', label: 'Bitcoin (BTC)', sub: 'Native Bitcoin Network', icon: '₿' },
                    { id: 'KES_MPESA', label: 'M-PESA (KES)', sub: 'Buy Goods Till 1722023', icon: '📱' }
                  ].map((coin) => (
                    <button
                      key={coin.id}
                      type="button"
                      onClick={() => {
                        setSelectedAsset(coin.id as any);
                        setErrorMessage('');
                      }}
                      className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${
                        selectedAsset === coin.id
                          ? 'bg-amber-500 text-black font-black border-amber-400 shadow-md'
                          : 'bg-[#080808] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{coin.icon}</span>
                        <span className="font-bold truncate text-xs">{coin.label}</span>
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">{coin.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Field with Real-time Crypto Conversion */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Deposit Amount (KES)</label>
                  <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Crypto Equivalent: {getCryptoEquivalent()}</span>
                  </div>
                </div>
                
                <div className="relative">
                  <span className="text-xs font-bold text-amber-400 absolute left-3.5 top-3 font-mono">KES</span>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={depositAmountKES}
                    onChange={(e) => setDepositAmountKES(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-13 pr-3 py-2.5 bg-black border border-slate-700 rounded-none text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  {[5000, 13000, 30000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmountKES(amt)}
                      className={`px-2.5 py-1.5 rounded-none text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        depositAmountKES === amt
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-[#080808] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Ksh {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* SPECIAL M-PESA ROUTING */}
              {selectedAsset === 'KES_MPESA' ? (
                <div className="p-4 bg-[#080808] border border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <Smartphone className="w-4 h-4" />
                      <span>Lipa Na M-PESA Till 1722023</span>
                    </span>
                    <span className="text-[10px] font-mono font-black bg-emerald-500 text-black px-2 py-0.5">
                      SMARTCHOICE VENTURES
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs">
                    To deposit via M-PESA directly to <b>Till 1722023</b> or receive an STK Push prompt on your handset, please use the dedicated M-PESA gateway:
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenMpesa) onOpenMpesa();
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open Lipa Na M-PESA Gateway &rarr;</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* REAL VAULT ADDRESS BOX WITH EXPLORER LINK */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <span>Receiving Vault ({activeAssetInfo.network})</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {activeAssetInfo.explorerUrl && (
                          <a
                            href={activeAssetInfo.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Verify on Explorer</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowQrCode(!showQrCode)}
                          className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{showQrCode ? 'Hide QR' : 'Show QR'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black border border-amber-500/40 p-2.5 rounded-none">
                      <span className="font-mono text-amber-300 text-[11px] break-all flex-1 pl-1 font-bold">
                        {activeAddress}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-none font-black flex items-center gap-1 cursor-pointer shrink-0 transition-all active:scale-95 text-xs uppercase"
                      >
                        {copiedAddress ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* REAL HIGH-RESOLUTION SCANNABLE QR CODE */}
                    {showQrCode && (
                      <div className="p-4 bg-[#0a0a0a] border border-amber-500/30 rounded-none flex flex-col items-center justify-center text-center space-y-2.5">
                        <div className="p-2.5 bg-white rounded-none shadow-lg inline-block">
                          <img 
                            src={qrCodeUrl} 
                            alt={`Deposit QR Code for ${activeAddress}`} 
                            className="w-44 h-44 block mx-auto object-contain"
                          />
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Point your <b>Trust Wallet</b>, <b>Binance</b>, <b>Bybit</b>, or <b>Metamask</b> camera to scan this exact receiving vault.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* METHOD 1: DIRECT WEB3 WALLET TRANSFER (FOR USDT BEP-20) */}
                  {selectedAsset === 'USDT_BEP20' && (
                    <div className="p-3 bg-gradient-to-r from-amber-950/40 via-black to-amber-950/40 border border-amber-500/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold flex items-center gap-1 text-xs uppercase tracking-wider">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Method 1: Direct Web3 Wallet Transfer</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">1-Click Sign</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Transfer <b>{getCryptoEquivalent()}</b> directly from your connected browser wallet (MetaMask, Trust Wallet, Binance Wallet). It automatically calls the official BSC USDT contract to transfer to your vault.
                      </p>
                      <button
                        type="button"
                        disabled={isWeb3Connecting}
                        onClick={handleWeb3DirectTransfer}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        {isWeb3Connecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span>Connecting & Awaiting Wallet Signature...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4" />
                            <span>Send {getCryptoEquivalent()} via Web3 Wallet</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* METHOD 2: MANUAL TRANSFER (BINANCE, BYBIT, TRUST WALLET MOBILE) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <span>Method 2: Manual Transfer & Blockchain Verification</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">From Binance/Bybit</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-300 uppercase tracking-wider mb-1 font-bold">
                          Blockchain Transaction Hash / TxID *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={selectedAsset === 'BTC' ? 'Paste 64-character Bitcoin TxID' : 'Paste 66-character BSC TxID (starts with 0x...)'}
                          value={txHashInput}
                          onChange={(e) => setTxHashInput(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none text-amber-300 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Sender Wallet Address (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0x... or bc1q..."
                          value={senderWalletAddress}
                          onChange={(e) => setSenderWalletAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-slate-800 rounded-none text-slate-300 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing || depositAmountKES <= 0}
                      onClick={handleVerifyManualTx}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Verifying On-Chain via Blockchain Node...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify On-Chain & Credit Balance</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
