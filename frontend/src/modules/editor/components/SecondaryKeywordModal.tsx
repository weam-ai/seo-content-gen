import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Lightbulb } from 'lucide-react';

interface SecondaryKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  existingKeywords: string[];
}

// Mock recommended keywords
const recommendedKeywords = [
  { keyword: 'content marketing', volume: 120, difficulty: 'medium' },
  { keyword: 'digital strategy', volume: 85, difficulty: 'low' },
  { keyword: 'brand awareness', volume: 95, difficulty: 'medium' },
  { keyword: 'social media', volume: 200, difficulty: 'high' },
  { keyword: 'email marketing', volume: 150, difficulty: 'medium' },
  { keyword: 'conversion rate', volume: 75, difficulty: 'low' },
];

export const SecondaryKeywordModal: React.FC<SecondaryKeywordModalProps> = ({
  isOpen,
  onClose,
  onAddKeyword,
  onRemoveKeyword,
  existingKeywords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const filteredRecommended = recommendedKeywords.filter(
    (item) =>
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !existingKeywords.includes(item.keyword)
  );

  const handleAddManual = () => {
    if (
      manualKeyword.trim() &&
      !existingKeywords.includes(manualKeyword.trim())
    ) {
      onAddKeyword(manualKeyword.trim());
      setManualKeyword('');
    }
  };

  const getDifficultyBackgroundColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800';
      case 'medium':
        return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'high':
        return 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Manage Secondary Keywords
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Manual Add */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Add New Keyword
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter keyword"
                  value={manualKeyword}
                  onChange={(e) => setManualKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                  className="flex-1 h-10 text-sm border border-gray-300 rounded-lg px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={handleAddManual}
                  disabled={
                    !manualKeyword.trim() ||
                    existingKeywords.includes(manualKeyword.trim())
                  }
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Current Keywords */}
            {existingKeywords.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Current Keywords ({existingKeywords.length})
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {existingKeywords
                      .filter((keyword) =>
                        keyword.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((keyword, index) => (
                        <div
                          key={`existing-keyword-${keyword}-${index}`}
                          className="group flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded text-xs transition-colors"
                        >
                          <span className="text-gray-700">{keyword}</span>
                          <X
                            className="h-3 w-3 text-gray-400 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => onRemoveKeyword(keyword)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Keywords */}
            {filteredRecommended.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Recommended Keywords
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {filteredRecommended.map((item, index) => (
                      <div
                        key={`recommended-${item.keyword}-${index}`}
                        onClick={() => onAddKeyword(item.keyword)}
                        className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${getDifficultyBackgroundColor(
                          item.difficulty
                        )}`}
                      >
                        <span className="font-medium">{item.keyword}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs opacity-70 bg-white bg-opacity-50 px-1 py-0.5 rounded">
                            {item.volume}
                          </span>
                          <Plus className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No results */}
            {searchTerm &&
              filteredRecommended.length === 0 &&
              !existingKeywords.some((keyword) =>
                keyword.toLowerCase().includes(searchTerm.toLowerCase())
              ) && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No keywords found for "{searchTerm}"
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
