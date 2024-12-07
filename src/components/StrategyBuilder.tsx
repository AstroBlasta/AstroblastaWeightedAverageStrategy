import React, { useState } from 'react';
import { Pool, Asset, Strategy } from '../types';
import { calculateWeightedYield, formatCurrency, formatPercentage } from '../utils/calculations';

interface StrategyBuilderProps {
  pools: Pool[];
  assets: Asset[];
  selectedPools: string[];
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  pools,
  assets,
  selectedPools,
}) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy>({
    name: '',
    allocations: [],
    weightedYield: 0,
    totalValue: 0,
  });

  const getAssetSymbol = (assetInfo: Pool['poolAssets'][0]['info']) => {
    if (assetInfo.token) {
      return assets.find(a => a.address === assetInfo.token?.contract_addr)?.symbol || 
             assets.find(a => a.id === assetInfo.token?.contract_addr)?.symbol || 
             'Unknown';
    }
    if (assetInfo.native_token) {
      return assets.find(a => a.denom === assetInfo.native_token?.denom)?.symbol || 'Unknown';
    }
    return 'Unknown';
  };

  const handleAllocationChange = (poolId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const newAllocations = currentStrategy.allocations.filter(a => a.poolId !== poolId);
    
    if (numAmount > 0) {
      newAllocations.push({ poolId, amount: numAmount });
    }

    const totalValue = newAllocations.reduce((sum, a) => sum + a.amount, 0);
    const weightedYield = calculateWeightedYield(newAllocations, pools);

    setCurrentStrategy({
      ...currentStrategy,
      allocations: newAllocations,
      weightedYield,
      totalValue,
    });
  };

  const saveStrategy = () => {
    if (currentStrategy.name && currentStrategy.allocations.length > 0) {
      setStrategies([...strategies, currentStrategy]);
      setCurrentStrategy({
        name: '',
        allocations: [],
        weightedYield: 0,
        totalValue: 0,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Strategy Builder</h2>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Strategy Name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={currentStrategy.name}
            onChange={(e) => setCurrentStrategy({ ...currentStrategy, name: e.target.value })}
          />
          
          {selectedPools.map(poolId => {
            const pool = pools.find(p => p.poolId === poolId);
            if (!pool) return null;
            
            const assetPair = pool.poolAssets.map(asset => getAssetSymbol(asset.info)).join(' / ');
            const allocation = currentStrategy.allocations.find(a => a.poolId === poolId);
            
            return (
              <div key={poolId} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{assetPair}</span>
                  <span className="text-green-600">
                    {formatPercentage(pool.percentageAPRs[0] || 0)} APY
                  </span>
                </div>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Amount in USD"
                  value={allocation?.amount || ''}
                  onChange={(e) => handleAllocationChange(poolId, e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total Value:</span>
              <span>{formatCurrency(currentStrategy.totalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Expected Yield:</span>
              <span className="text-green-600">
                {formatPercentage(currentStrategy.weightedYield)}
              </span>
            </div>
          </div>
          
          <button
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            onClick={saveStrategy}
            disabled={!currentStrategy.name || currentStrategy.allocations.length === 0}
          >
            Save Strategy
          </button>
        </div>
      </div>

      {strategies.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Saved Strategies</h2>
          <div className="space-y-4">
            {strategies.map((strategy, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="text-xl font-bold mb-2">{strategy.name}</h3>
                <div className="space-y-2">
                  {strategy.allocations.map(allocation => {
                    const pool = pools.find(p => p.poolId === allocation.poolId);
                    if (!pool) return null;
                    
                    const assetPair = pool.poolAssets
                      .map(asset => getAssetSymbol(asset.info))
                      .join(' / ');
                    
                    return (
                      <div key={allocation.poolId} className="flex justify-between">
                        <span>{assetPair}</span>
                        <span>{formatCurrency(allocation.amount)}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Value:</span>
                      <span>{formatCurrency(strategy.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Expected Yield:</span>
                      <span className="text-green-600">
                        {formatPercentage(strategy.weightedYield)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};