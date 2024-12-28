import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Dashboard from './Dashboard'; // Import Dashboard component

const MetaMaskAuth = () => {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        setError('Please install MetaMask');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        const storedAccount = localStorage.getItem('account');
        if (storedAccount) {
          setAccount(storedAccount);
          setIsConnected(true);
        }
      }
    } catch (error) {
      setError('Error connecting to MetaMask');
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        setError('Please install MetaMask');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAccount(accounts[0]);
      setIsConnected(true);
      setError('');
      localStorage.setItem('account', accounts[0]); // Save account to local storage
    } catch (error) {
      setError('Error connecting to MetaMask');
      console.error(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const LoginPage = () => (
    <div className="w-full max-w-md mx-auto mt-20 bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold">Login with MetaMask</h2>
      </div>
      <div className="mb-4">
        <button
          onClick={connectWallet}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md"
        >
          Connect Wallet
        </button>
      </div>
      {error && (
        <div className="flex items-center mt-4 text-red-500">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  return isConnected ? <Dashboard account={account} /> : <LoginPage />;
};

export default MetaMaskAuth;