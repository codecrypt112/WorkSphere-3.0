import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';

const FundProject = ({ 
  project, 
  account, 
  onFundingComplete 
}) => {
  const [web3, setWeb3] = useState(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Secure wallet address (you should store this securely)
  const SECURE_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
        } catch (error) {
          console.error("Could not connect to MetaMask", error);
          setError("Could not connect to MetaMask");
        }
      } else {
        setError("Please install MetaMask");
      }
    };

    initWeb3();
  }, []);

  const handleFundProject = async () => {
    if (!web3 || !account) {
      setError("Please connect your wallet");
      return;
    }

    // Validate funding amount
    const amountInEther = parseFloat(fundingAmount);
    if (isNaN(amountInEther) || amountInEther <= 0) {
      setError("Please enter a valid funding amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert Ether to Wei
      const amountInWei = web3.utils.toWei(fundingAmount, 'ether');

      // Send transaction
      const transaction = await web3.eth.sendTransaction({
        from: account,
        to: SECURE_WALLET_ADDRESS,
        value: amountInWei
      });

      // Record funding in backend
      const fundingResponse = await axios.post('http://localhost:5000/api/projects/fund', {
        projectId: project._id,
        fundingWallet: account,
        amount: fundingAmount,
        transactionHash: transaction.transactionHash
      });

      // Notify parent component
      onFundingComplete(fundingAmount);

      // Reset form
      setFundingAmount('');
      setLoading(false);
    } catch (error) {
      console.error("Funding failed", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Fund Project</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Funding Amount (ETH)
        </label>
        <input
          type="number"
          value={fundingAmount}
          onChange={(e) => setFundingAmount(e.target.value)}
          placeholder="Enter amount in ETH"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <button
        onClick={handleFundProject}
        disabled={loading}
        className={`w-full py-2 px-4 rounded ${
          loading 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Processing...' : 'Fund Project'}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>Funding to: {SECURE_WALLET_ADDRESS}</p>
        <p>Current Project: {project.title}</p>
      </div>
    </div>
  );
};

export default FundProject;