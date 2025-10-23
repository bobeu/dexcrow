"use client";

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import TradingInterface from './trading/TradingInterface';
import EscrowInterface from './escrow/EscrowInterface';

/**
 * @fileoverview Main dashboard component for TradeVerse
 * @author TradeVerse Team
 */

type Feature = 'escrow' | 'trading';

const Dashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [activeFeature, setActiveFeature] = useState<Feature>('escrow');

  const features = [
    {
      id: 'escrow' as Feature,
      name: 'Escrow System',
      description: 'Secure peer-to-peer transactions with dispute resolution',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'blue',
      stats: {
        total: '1,234',
        active: '89',
        completed: '1,145'
      }
    },
    {
      id: 'trading' as Feature,
      name: 'Trading Platform',
      description: 'Decentralized trading with multi-chain support and live pricing',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'green',
      stats: {
        total: '5,678',
        active: '234',
        completed: '5,444'
      }
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          hover: 'hover:bg-blue-600',
          text: 'text-blue-600',
          border: 'border-blue-200',
          light: 'bg-blue-50'
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          hover: 'hover:bg-green-600',
          text: 'text-green-600',
          border: 'border-green-200',
          light: 'bg-green-50'
        };
      default:
        return {
          bg: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          text: 'text-gray-600',
          border: 'border-gray-200',
          light: 'bg-gray-50'
        };
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TradeVerse</h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to access decentralized escrow and trading features
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TradeVerse</h1>
              <span className="ml-3 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                v1.0.0
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Selection */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            {features.map((feature) => {
              const colors = getColorClasses(feature.color);
              const isActive = activeFeature === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${colors.bg} text-white shadow-md`
                      : `text-gray-600 hover:bg-gray-50 border ${colors.border}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${isActive ? 'text-white' : colors.text}`}>
                      {feature.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{feature.name}</div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {feature.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const colors = getColorClasses(feature.color);
              const isActive = activeFeature === feature.id;
              
              return (
                <div
                  key={feature.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isActive
                      ? `${colors.light} ${colors.border} border-opacity-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{feature.name}</h3>
                      <div className="flex space-x-4 mt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Total: </span>
                          <span className="font-medium">{feature.stats.total}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Active: </span>
                          <span className="font-medium">{feature.stats.active}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Completed: </span>
                          <span className="font-medium">{feature.stats.completed}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`${colors.text} ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                      {feature.icon}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Content */}
      <main className="max-w-7xl mx-auto">
        {activeFeature === 'escrow' && <EscrowInterface />}
        {activeFeature === 'trading' && <TradingInterface />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TradeVerse</h3>
              <p className="text-gray-600 mb-4">
                A comprehensive decentralized platform combining secure escrow services 
                with advanced trading capabilities across multiple blockchains.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Escrow System</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Trading Platform</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Multi-chain Support</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Live Price Feeds</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Bug Reports</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 TradeVerse. All rights reserved. Built with ❤️ for the decentralized future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
