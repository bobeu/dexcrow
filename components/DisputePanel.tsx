import React from 'react';
import { UserRole } from '../lib/types';
import { AlertTriangle, Clock, User, MessageSquare } from 'lucide-react';

interface DisputePanelProps {
  disputeInfo: any;
  userRole: UserRole;
  onResolveDispute: (releaseFunds: boolean, reasoning: string) => void;
  isLoading: boolean;
}

const DisputePanel: React.FC<DisputePanelProps> = ({
  disputeInfo,
  userRole,
  onResolveDispute,
  isLoading
}) => {
  if (!disputeInfo) return null;

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isArbiter = userRole === 'Arbiter';
  const isDisputer = userRole === 'Buyer' || userRole === 'Seller';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <h3 className="text-lg font-semibold text-red-900">Dispute Raised</h3>
      </div>

      <div className="space-y-4">
        {/* Dispute Information */}
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Dispute Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-700">Raised by:</span>
              <span className="font-mono text-red-900">
                {formatAddress(disputeInfo.disputer)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Reason:</span>
              <span className="text-red-900">{disputeInfo.reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Raised at:</span>
              <span className="text-red-900">
                {formatTimestamp(disputeInfo.raisedAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Status:</span>
              <span className="text-red-900">
                {disputeInfo.isActive ? 'Active' : 'Resolved'}
              </span>
            </div>
          </div>
        </div>

        {/* Arbiter Information */}
        <div className="bg-cyan-50 rounded-lg p-4">
          <h4 className="font-medium text-cyan-900 mb-2">Arbiter Assignment</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cyan-700">Assigned to:</span>
              <span className="font-mono text-cyan-900">
                {formatAddress(disputeInfo.arbiter)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-700">Your role:</span>
              <span className="text-cyan-900 capitalize">{userRole}</span>
            </div>
          </div>
        </div>

        {/* Resolution Information */}
        {!disputeInfo.isActive && disputeInfo.resolvedAt && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Decision:</span>
                <span className={`font-medium ${
                  disputeInfo.arbiterDecision ? 'text-green-600' : 'text-red-600'
                }`}>
                  {disputeInfo.arbiterDecision ? 'Release Funds' : 'Refund Funds'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Resolved at:</span>
                <span className="text-gray-900">
                  {formatTimestamp(disputeInfo.resolvedAt)}
                </span>
              </div>
              {disputeInfo.arbiterReasoning && (
                <div className="mt-2">
                  <span className="text-gray-700">Reasoning:</span>
                  <p className="text-gray-900 mt-1 p-2 bg-white rounded border">
                    {disputeInfo.arbiterReasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isArbiter && disputeInfo.isActive && (
          <div className="bg-cyan-50 rounded-lg p-4">
            <h4 className="font-medium text-cyan-900 mb-3">Arbiter Decision Required</h4>
            <p className="text-sm text-cyan-700 mb-4">
              As the assigned arbiter, you need to review the dispute and make a decision.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => onResolveDispute(true, 'Evidence supports seller')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Release Funds'}
              </button>
              <button
                onClick={() => onResolveDispute(false, 'Evidence supports buyer')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Refund Funds'}
              </button>
            </div>
          </div>
        )}

        {/* Information for Disputer */}
        {isDisputer && disputeInfo.isActive && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Dispute Status</h4>
            <p className="text-sm text-yellow-700">
              Your dispute has been raised and is awaiting arbiter review. 
              The arbiter will make a decision based on the evidence provided.
            </p>
          </div>
        )}

        {/* Information for Other Parties */}
        {!isArbiter && !isDisputer && disputeInfo.isActive && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Dispute in Progress</h4>
            <p className="text-sm text-blue-700">
              A dispute has been raised for this escrow. The arbiter will review 
              the case and make a decision.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputePanel;
