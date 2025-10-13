import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Target,
  Brain,
  Plus,
  FileText,
  Search,
  Info,
  X,
  Edit2,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react';
import type {
  ProjectDetail as ProjectDetailType,
  Keyword,
} from '@/lib/services/project.service';
import ProjectService from '@/lib/services/project.service';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/simple-pagination';
import PromptTypeService, {
  PromptType,
} from '@/lib/services/prompt-type.service';
import { ExportToExcel } from '@/components/ui/ExportToExcel';
import RegenerateTitleModal from '@/components/topics/RegenerateTitleModal';
import { updateArticle, generateOutline, deleteArticle } from '@/lib/services/topics.service';
import CsvKeywordTypeModal from '@/components/ui/CsvKeywordTypeModal';

// Add type for sortable fields in Targeted Keywords
type TargetedSortableField =
  | 'keyword'
  | 'volume'
  | 'competition'
  | 'articleType'
  | 'status';

interface DisplayKeyword {
  id: string;
  keyword: string;
  volume: number;
  competition: string;
  articleType?: string;
  status?: string;
  isNew?: boolean;
  isEditing?: boolean;
  title: string | null;
  [key: string]: string | number | boolean | undefined | null; // Allow index signature for sorting
}

interface ProjectKeywordsTabProps {
  project: ProjectDetailType;
}

export default function ProjectKeywordsTab({
  project,
}: ProjectKeywordsTabProps) {
  const [targetedKeywords, setTargetedKeywords] = useState<DisplayKeyword[]>(
    []
  );
  const [editingKeywords, setEditingKeywords] = useState<DisplayKeyword[]>([]);
  const [recommendedKeywords, setRecommendedKeywords] = useState<
    DisplayKeyword[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedCurrentPage, setRecommendedCurrentPage] = useState(1);
  const [recommendedItemsPerPage, setRecommendedItemsPerPage] = useState(10);
  const [targetedCurrentPage, setTargetedCurrentPage] = useState(1);
  const [targetedItemsPerPage, setTargetedItemsPerPage] = useState(10);
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [targetedSearch, setTargetedSearch] = useState('');
  const [targetedSort, setTargetedSort] =
    useState<TargetedSortableField>('keyword');
  const [targetedSortDir, setTargetedSortDir] = useState('asc');
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [recommendedSearch, setRecommendedSearch] = useState('');
  const [recommendedSort, setRecommendedSort] = useState<
    'keyword' | 'volume' | 'competition'
  >('keyword');
  const [recommendedSortDir, setRecommendedSortDir] = useState<'asc' | 'desc'>(
    'asc'
  );
  const [regenerateTitleModalOpen, setRegenerateTitleModalOpen] =
    useState(false);
  const [
    pendingKeywordForTitleRegeneration,
    setPendingKeywordForTitleRegeneration,
  ] = useState<DisplayKeyword | null>(null);
  const [regeneratedOutline, setRegeneratedOutline] = useState<string>('');
  const [articleTypeModalLoading, setArticleTypeModalLoading] = useState(false);
  const [keywordInputErrors, setKeywordInputErrors] = useState<{
    [id: string]: string;
  }>({});
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvKeywords, setCsvKeywords] = useState<string[]>([]);
  const [csvKeywordTypes, setCsvKeywordTypes] = useState<{
    [k: string]: string;
  }>({});
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore fetching hooks
  useEffect(() => {
    async function fetchProjectKeywords() {
      if (project?._id) {
        try {
          const response = await ProjectService.getProjectKeywords(project._id);
          if (response.status && response.data) {
            const apiTargetedKeywords: DisplayKeyword[] = response.data.map(
              (k: Keyword) => ({
                id: k.article_id,
                keyword: k.keyword,
                volume: k.volume,
                competition: k.difficulty,
                articleType: k.prompt_type_id,
                title: k.title,
                status: k.is_title_generated ? 'Generated' : 'Pending',
              })
            );
            setTargetedKeywords(apiTargetedKeywords);
          }
        } catch (error) {
          toast({
            title: 'Error fetching project keywords',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred.',
            variant: 'destructive',
          });
        }
      }
    }
    fetchProjectKeywords();
  }, [project?._id]);

  useEffect(() => {
    const fetchPromptTypes = async () => {
      try {
        const response = await PromptTypeService.getAllPromptTypes();
        if (response.status && response.data) {
          setPromptTypes(response.data);
        } else {
          toast({
            title: 'Error fetching prompt types',
            description: response.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    };
    fetchPromptTypes();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (project?._id && project?.keywords) {
        setIsLoading(true);
        try {
          const response = await ProjectService.fetchKeywordRecommendation(
            project._id
          );

          if (response.status && response.data) {
            const apiRecommendedKeywords: DisplayKeyword[] = response.data.map(
              (k, index) => ({
                id: `${k.keyword}-${index}`,
                keyword: k.keyword,
                volume: k.search_volume,
                competition: k.competition,
                title: k.title,
              })
            );

            // No need to filter out already targeted keywords, as backend already filters them
            setRecommendedKeywords(apiRecommendedKeywords);
          } else {
            toast({
              title: 'Error',
              description:
                response.message || 'Failed to fetch keyword recommendations.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (targetedKeywords.length) fetchRecommendations();
  }, [project, targetedKeywords]); // Remove targetedKeywords from dependency array

  // Combine stable and editing keywords for display
  // Manual (isNew) keywords always at the top, not affected by sorting/filtering
  const manualKeywords = editingKeywords.filter((k) => k.isNew);
  const nonManualKeywords = useMemo(() => {
    return [...targetedKeywords, ...editingKeywords.filter((k) => !k.isNew)];
  }, [targetedKeywords, editingKeywords]);

  // Filter and sort for Targeted Keywords
  const filteredAndSortedTargetedKeywords = useMemo(() => {
    let filtered = nonManualKeywords;
    if (targetedSearch.trim()) {
      filtered = filtered.filter((k) =>
        k.keyword.toLowerCase().includes(targetedSearch.toLowerCase())
      );
    }
    filtered = [...filtered].sort((a, b) => {
      const field = targetedSort;
      let aValue = a[field] ?? '';
      let bValue = b[field] ?? '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return targetedSortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return targetedSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    // Manual keywords always at the top
    return [...manualKeywords, ...filtered];
  }, [
    manualKeywords,
    nonManualKeywords,
    targetedSearch,
    targetedSort,
    targetedSortDir,
  ]);

  // Filter for Recommended Keywords
  const filteredRecommendedKeywords = useMemo(() => {
    if (!recommendedSearch.trim()) return recommendedKeywords;
    return recommendedKeywords.filter((k) =>
      k.keyword.toLowerCase().includes(recommendedSearch.toLowerCase())
    );
  }, [recommendedKeywords, recommendedSearch]);

  // Add sorting to recommended keywords
  type SortableField = 'keyword' | 'volume' | 'competition' | 'articleType';
  const filteredAndSortedRecommendedKeywords = useMemo(() => {
    let filtered = filteredRecommendedKeywords;
    const field = recommendedSort as SortableField;
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[field] ?? '';
      let bValue = b[field] ?? '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return recommendedSortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return recommendedSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [filteredRecommendedKeywords, recommendedSort, recommendedSortDir]);

  const paginatedRecommendedKeywords =
    filteredAndSortedRecommendedKeywords.slice(
      (recommendedCurrentPage - 1) * recommendedItemsPerPage,
      recommendedCurrentPage * recommendedItemsPerPage
    );

  // Add pagination for targeted keywords
  const paginatedTargetedKeywords = filteredAndSortedTargetedKeywords.slice(
    (targetedCurrentPage - 1) * targetedItemsPerPage,
    targetedCurrentPage * targetedItemsPerPage
  );

  const [selectedKeywords, setSelectedKeywords] = useState(new Set<string>());

  const handleKeywordSelect = (keywordId: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keywordId)) {
      newSelected.delete(keywordId);
    } else {
      newSelected.add(keywordId);
    }
    setSelectedKeywords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === recommendedKeywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(recommendedKeywords.map((k) => k.id)));
    }
  };

  // Remove old showArticleTypeModal/pendingKeywords logic for recommended->targeted
  // Update moveKeywordToTargeted to use CsvKeywordTypeModal
  const moveKeywordToTargeted = (keyword: DisplayKeyword) => {
    setCsvKeywords([keyword.keyword]);
    setCsvKeywordTypes({ [keyword.keyword]: promptTypes[0]?._id || '' });
    setCsvModalOpen(true);
  };

  const handleBulkApprove = () => {
    const keywordsToMove = recommendedKeywords.filter((k) =>
      selectedKeywords.has(k.id)
    );
    if (keywordsToMove.length > 0) {
      const keys = keywordsToMove.map((k) => k.keyword);
      setCsvKeywords(keys);
      setCsvKeywordTypes(
        Object.fromEntries(keys.map((k) => [k, promptTypes[0]?._id || '']))
      );
      setCsvModalOpen(true);
    }
  };

  // Drag-and-drop handler already calls moveKeywordToTargeted

  const handleDragStart = (e: React.DragEvent, keyword: DisplayKeyword) => {
    e.dataTransfer.setData('application/json', JSON.stringify(keyword));
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  // Optimized function to prevent re-renders with debouncing
  const updateKeywordField = useCallback(
    (id: string, field: keyof DisplayKeyword, value: any) => {
      setEditingKeywords((prev) =>
        prev.map((keyword) =>
          keyword.id === id ? { ...keyword, [field]: value } : keyword
        )
      );
    },
    []
  );

  const saveKeywordRow = useCallback(
    async (id: string) => {
      setRowLoadingId(id);
      setEditingKeywords((prev) => {
        const keyword = prev.find((k) => k.id === id);
        if (!keyword || !keyword.keyword.trim() || !keyword.articleType) {
          toast({
            title: 'Error',
            description: 'Please enter both keyword and article type.',
            variant: 'destructive',
          });
          setRowLoadingId(null);
          return prev;
        }
        // Check for duplicates in both stable and editing keywords
        const allKeywords = [...targetedKeywords, ...prev];
        const duplicateExists = allKeywords.some(
          (k) =>
            k.id !== id &&
            k.keyword.toLowerCase() === keyword.keyword.toLowerCase()
        );
        if (duplicateExists) {
          toast({
            title: 'Error',
            description: 'This keyword already exists.',
            variant: 'destructive',
          });
          setRowLoadingId(null);
          return prev;
        }
        return prev;
      });
      const keyword = editingKeywords.find((k) => k.id === id);
      if (!keyword || !keyword.keyword.trim() || !keyword.articleType) {
        setRowLoadingId(null);
        return;
      }
      if (!project?._id) {
        setRowLoadingId(null);
        return;
      }
      try {
        let response;
        let responseData: Keyword[] | null = null;
        if (keyword.id.startsWith('new-')) {
          // New keyword: add
          const payload = [
            { keyword: keyword.keyword, promptTypeId: keyword.articleType },
          ];
          response = await ProjectService.addProjectKeywords(
            project._id,
            payload
          );
          responseData = response.data;
        } else {
          // Existing keyword: update
          response = await ProjectService.updateProjectKeyword(keyword.id, {
            prompt_type: keyword.articleType,
            keywords: keyword.keyword,
          });
        }
        if (response.status) {
          let is_title_generated =
            responseData?.find((k) => k.keyword === keyword.keyword)
              ?.is_title_generated || true;
          toast({
            title: 'Saved',
            description:
              'Keyword saved.' +
              (is_title_generated
                ? '(Title generated failed due to internal server error, would be auto generate after some time)'
                : ''),
          });

          // Refresh targeted keywords from backend
          const refreshed = await ProjectService.getProjectKeywords(project._id);
          if (refreshed.status && refreshed.data) {
            const apiTargetedKeywords: DisplayKeyword[] = refreshed.data.map(
              (k: Keyword) => ({
                id: k.article_id,
                keyword: k.keyword,
                volume: k.volume,
                competition: k.difficulty,
                articleType: k.prompt_type_id,
                title: k.title,
                status: k.is_title_generated ? 'Generated' : 'Pending',
              })
            );
            setTargetedKeywords(apiTargetedKeywords);
            setEditingKeywords((prev) => prev.filter((k) => k.id !== id));
          }
        } else {
          toast({
            title: 'Error',
            description: response.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred.',
          variant: 'destructive',
        });
      } finally {
        setRowLoadingId(null);
      }
    },
    [targetedKeywords, editingKeywords, project?._id]
  );

  const cancelEdit = useCallback((id: string) => {
    setEditingKeywords((prev) => {
      const keyword = prev.find((k) => k.id === id);
      if (keyword?.isNew) {
        // Remove the new row if it's being cancelled
        return prev.filter((k) => k.id !== id);
      } else if (keyword) {
        // Move back to stable keywords without editing state
        setTargetedKeywords((prevStable) => [
          ...prevStable,
          { ...keyword, isEditing: false },
        ]);
        return prev.filter((k) => k.id !== id);
      }
      return prev;
    });
  }, []);

  const startEdit = useCallback((id: string) => {
    setTargetedKeywords((prev) => {
      const keyword = prev.find((k) => k.id === id);
      if (keyword) {
        // Move to editing keywords
        setEditingKeywords((prevEditing) => [
          ...prevEditing,
          { ...keyword, isEditing: true },
        ]);
        // Remove from stable keywords
        return prev.filter((k) => k.id !== id);
      }
      return prev;
    });
  }, []);

  const removeKeyword = useCallback((id: string) => {
    // Check if it's in editing keywords
    setEditingKeywords((prev) => {
      const keyword = prev.find((k) => k.id === id);
      if (keyword) {
        return prev.filter((k) => k.id !== id);
      }
      return prev;
    });

    // Check if it's in stable keywords
    setTargetedKeywords((prev) => {
      const keyword = prev.find((k) => k.id === id);
      if (keyword) {
        return prev.filter((k) => k.id !== id);
      }
      return prev;
    });
  }, []);

  const deleteKeyword = useCallback(async (id: string) => {
    // Don't delete new keywords that haven't been saved yet
    if (id.startsWith('new-')) {
      removeKeyword(id);
      return;
    }

    try {
      setRowLoadingId(id);
      const response = await deleteArticle(id);
      
      if (response) {
        toast({
          title: 'Success',
          description: 'Keyword deleted successfully.',
        });
        
        // Remove from local state
        removeKeyword(id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete keyword.',
        variant: 'destructive',
      });
    } finally {
      setRowLoadingId(null);
    }
  }, [removeKeyword]);

  const addNewKeywordRow = useCallback(() => {
    const newKeyword: DisplayKeyword = {
      id: `new-${Date.now()}`,
      keyword: '',
      volume: 0,
      competition: 'MEDIUM',
      articleType: '',
      status: 'Pending',
      isNew: true,
      isEditing: true,
      title: null,
    };
    setEditingKeywords((prev) => [...prev, newKeyword]);
  }, [targetedKeywords, editingKeywords]);

  return (
    <div className="space-y-6">
      {/* Side-by-side layout for keyword tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Target Keywords Table - Left Side */}
        <Card className="hover-lift">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-800" />
                <CardTitle className="text-lg">Targeted Keywords</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 h-8 w-full"
                    value={targetedSearch}
                    onChange={(e) => setTargetedSearch(e.target.value)}
                  />
                </div>
                <Button
                  onClick={addNewKeywordRow}
                  size="sm"
                  variant="outline"
                  className="hover-lift"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-lift"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import CSV
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    setCsvError(null);
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (!text) {
                        setCsvError('Empty file.');
                        return;
                      }
                      // Parse CSV: support both horizontal and vertical
                      let keywords: string[] = [];
                      const lines = text
                        .split(/\r?\n/)
                        .map((l) => l.trim())
                        .filter(Boolean);
                      for (const line of lines) {
                        const cells = line
                          .split(',')
                          .map((cell) => cell.trim())
                          .filter(Boolean);
                        if (cells.length > 1) {
                          keywords.push(...cells);
                        } else if (cells.length === 1) {
                          keywords.push(cells[0]);
                        }
                      }
                      // Remove duplicates and empty
                      keywords = Array.from(
                        new Set(keywords.map((k) => k.trim()).filter(Boolean))
                      );
                      if (keywords.length === 0) {
                        setCsvError('No keywords found in CSV.');
                        return;
                      }
                      setCsvKeywords(keywords);
                      setCsvKeywordTypes(
                        Object.fromEntries(
                          keywords.map((k) => [k, promptTypes[0]?._id || ''])
                        )
                      );
                      setCsvModalOpen(true);
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Drop Zone Table */}
            <div
              className="border-2 border-dashed border-muted-foreground/20 rounded-lg transition-colors overflow-x-auto"
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = e.dataTransfer.getData('application/json');
                  if (data) {
                    const keyword = JSON.parse(data);
                    moveKeywordToTargeted(keyword);
                  }
                } catch (err) {
                  // Optionally handle error
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
            >
              <table className="min-w-[700px] w-full">
                <thead className="bg-muted/30">
                  <tr className="text-xs sm:text-sm">
                    <th
                      className="text-left p-2 sm:p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (targetedSort === 'keyword')
                          setTargetedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setTargetedSort('keyword');
                      }}
                    >
                      Keyword{' '}
                      {targetedSort === 'keyword' &&
                        (targetedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-2 sm:p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (targetedSort === 'volume')
                          setTargetedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setTargetedSort('volume');
                      }}
                    >
                      Volume{' '}
                      {targetedSort === 'volume' &&
                        (targetedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-2 sm:p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (targetedSort === 'competition')
                          setTargetedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setTargetedSort('competition');
                      }}
                    >
                      Competition{' '}
                      {targetedSort === 'competition' &&
                        (targetedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-2 sm:p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (targetedSort === 'articleType')
                          setTargetedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setTargetedSort('articleType');
                      }}
                    >
                      Article Type{' '}
                      {targetedSort === 'articleType' &&
                        (targetedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-2 sm:p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (targetedSort === 'status')
                          setTargetedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setTargetedSort('status');
                      }}
                    >
                      Status{' '}
                      {targetedSort === 'status' &&
                        (targetedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="w-20 p-2 sm:p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTargetedKeywords.map((keyword) => (
                    <tr
                      key={keyword.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        keyword.isNew ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-2 sm:p-3">
                        {keyword.isEditing ? (
                          <>
                            <Input
                              value={keyword.keyword}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateKeywordField(
                                  keyword.id,
                                  'keyword',
                                  value
                                );
                                // Check for duplicate in all keywords except this row
                                const allKeywords = [
                                  ...targetedKeywords,
                                  ...editingKeywords.filter(
                                    (k) => k.id !== keyword.id
                                  ),
                                ];
                                const isDuplicate = allKeywords.some(
                                  (k) =>
                                    k.keyword.trim().toLowerCase() ===
                                    value.trim().toLowerCase()
                                );
                                setKeywordInputErrors((prev) => ({
                                  ...prev,
                                  [keyword.id]:
                                    isDuplicate && value.trim()
                                      ? 'This keyword already exists.'
                                      : '',
                                }));
                              }}
                              placeholder="Enter keyword..."
                              className="h-8 text-xs sm:text-sm"
                              onKeyPress={(e) => {
                                if (
                                  e.key === 'Enter' &&
                                  keyword.keyword.trim() &&
                                  keyword.articleType
                                ) {
                                  saveKeywordRow(keyword.id);
                                }
                              }}
                            />
                            <span className="text-red-500 text-xs">
                              {keywordInputErrors[keyword.id]}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-xs sm:text-sm">
                            {keyword.keyword}
                          </span>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
                        {keyword.volume?.toLocaleString()}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            keyword.competition === 'HIGH'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {keyword.competition}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
                        {promptTypes.length > 0 ? (
                          <Select
                            value={keyword.articleType}
                            onValueChange={(value) => {
                              updateKeywordField(
                                keyword.id,
                                'articleType',
                                value
                              );
                              // If this is an existing keyword (not new), trigger title regeneration
                              if (!keyword.id.startsWith('new-') && value) {
                                setPendingKeywordForTitleRegeneration(keyword);
                                setRegenerateTitleModalOpen(true);
                              }
                            }}
                            disabled={!keyword.isEditing}
                          >
                            <SelectTrigger className="w-32 sm:w-40 h-8 px-2">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {promptTypes.map((type) => (
                                <SelectItem key={type._id} value={type._id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          keyword.articleType
                        )}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            keyword.status === 'Generated'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {keyword.status}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1">
                          {keyword.isEditing ? (
                            <>
                              <Button
                                onClick={() => saveKeywordRow(keyword.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={
                                  !keyword.keyword.trim() ||
                                  !keyword.articleType ||
                                  rowLoadingId === keyword.id ||
                                  keywordInputErrors[keyword.id] !== ''
                                }
                              >
                                {rowLoadingId === keyword.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => cancelEdit(keyword.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => startEdit(keyword.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => deleteKeyword(keyword.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={rowLoadingId === keyword.id}
                              >
                                {rowLoadingId === keyword.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : keyword.isNew ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedTargetedKeywords.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Target className="h-8 w-8 text-muted-foreground/50" />
                          <p>No targeted keywords yet</p>
                          <p className="text-sm">
                            Click "Add Keyword" to add manually, drag from
                            recommendations, or use bulk approve
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={targetedCurrentPage}
              totalItems={filteredAndSortedTargetedKeywords.length}
              itemsPerPage={targetedItemsPerPage}
              onPageChange={setTargetedCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setTargetedItemsPerPage(newSize);
                setTargetedCurrentPage(1);
              }}
              showPageSizeSelector={true}
              showJumpToPage={true}
            />
          </CardContent>
        </Card>

        {/* AI Recommended Keywords Table - Right Side */}
        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-gray-800" />
                <CardTitle className="text-lg">Recommended Keywords</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 h-8"
                    value={recommendedSearch}
                    onChange={(e) => setRecommendedSearch(e.target.value)}
                  />
                </div>
                {selectedKeywords.size > 0 && (
                  <Button
                    onClick={handleBulkApprove}
                    size="sm"
                    className="bg-[hsl(var(--razor-primary))] text-white hover-lift"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Approve Selected ({selectedKeywords.size})
                  </Button>
                )}
                <ExportToExcel
                  columns={[
                    { header: 'Keyword', accessor: 'keyword' },
                    { header: 'Volume', accessor: 'volume' },
                    { header: 'Competition', accessor: 'competition' },
                  ]}
                  data={recommendedKeywords}
                  filename="recommended-keywords.xlsx"
                >
                  <Button variant="outline" size="sm" className="hover-lift">
                    <FileText className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </ExportToExcel>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table with Drag & Drop and Selection */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr className="text-sm">
                    <th className="w-12 p-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={
                          selectedKeywords.size ===
                            recommendedKeywords.length &&
                          recommendedKeywords.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (recommendedSort === 'keyword')
                          setRecommendedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setRecommendedSort('keyword');
                      }}
                    >
                      Keyword{' '}
                      {recommendedSort === 'keyword' &&
                        (recommendedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (recommendedSort === 'volume')
                          setRecommendedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setRecommendedSort('volume');
                      }}
                    >
                      Volume{' '}
                      {recommendedSort === 'volume' &&
                        (recommendedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left p-3 font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => {
                        if (recommendedSort === 'competition')
                          setRecommendedSortDir((d) =>
                            d === 'asc' ? 'desc' : 'asc'
                          );
                        setRecommendedSort('competition');
                      }}
                    >
                      Competition{' '}
                      {recommendedSort === 'competition' &&
                        (recommendedSortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="w-20 p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <tr key={`skeleton-row-${index}`}>
                          <td className="p-3" colSpan={5}>
                            <Skeleton className="h-8 w-full" />
                          </td>
                        </tr>
                      ))
                    : paginatedRecommendedKeywords.map(
                        (keyword: DisplayKeyword) => (
                          <tr
                            key={keyword.id}
                            className="hover:bg-muted/20 transition-colors cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => handleDragStart(e, keyword)}
                            onDragEnd={handleDragEnd}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedKeywords.has(keyword.id)}
                                onChange={() => handleKeywordSelect(keyword.id)}
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-sm">
                                {keyword.keyword}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {keyword.volume?.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-1">
                                {keyword.competition}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                onClick={() => moveKeywordToTargeted(keyword)}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs hover-lift"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        )
                      )}
                  {!isLoading && filteredRecommendedKeywords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Brain className="h-8 w-8 text-muted-foreground/50" />
                          <p>All keywords have been approved!</p>
                          <p className="text-sm">
                            Generate more recommendations to continue
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={recommendedCurrentPage}
              totalItems={filteredRecommendedKeywords.length}
              itemsPerPage={recommendedItemsPerPage}
              onPageChange={setRecommendedCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setRecommendedItemsPerPage(newSize);
                setRecommendedCurrentPage(1);
              }}
              showPageSizeSelector={true}
              showJumpToPage={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Instructions Card */}
      <Card className="bg-blue-50/50 border-blue-200/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-700 text-sm">
                <strong>Tip:</strong> Click "Add Keyword" to add keywords
                manually, drag keywords from the Recommended section to add them
                to your Targeted keywords, use checkboxes for bulk selection, or
                click the individual + buttons for quick approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CsvKeywordTypeModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        keywords={csvKeywords}
        setKeywords={setCsvKeywords}
        keywordTypes={csvKeywordTypes}
        setKeywordTypes={setCsvKeywordTypes}
        promptTypes={promptTypes}
        error={csvError}
        setError={setCsvError}
        loading={articleTypeModalLoading}
        onApply={async () => {
          // Validate all keywords have article type selected
          const missing = csvKeywords.filter((k) => !csvKeywordTypes[k]);
          if (missing.length > 0) {
            setCsvError('Please select article type for all keywords.');
            return;
          }

          // Filter out duplicates (already in targetedKeywords or editingKeywords)
          const allExisting = [...targetedKeywords, ...editingKeywords].map(
            (k) => k.keyword.toLowerCase()
          );
          const newPairs = csvKeywords
            .map((k) => ({ keyword: k, promptTypeId: csvKeywordTypes[k] }))
            .filter(
              (pair) => !allExisting.includes(pair.keyword.toLowerCase())
            );

          if (newPairs.length === 0) {
            setCsvError('All keywords already exist in the table.');
            return;
          }

          if (!project?._id) {
            setCsvError('Project not found.');
            return;
          }
          setArticleTypeModalLoading(true);
          try {
            const response = await ProjectService.addProjectKeywords(
              project._id,
              newPairs
            );
            if (response.status) {
              const apiTargetedKeywords = response.data.map((k) => ({
                id: k.article_id,
                keyword: k.keyword,
                volume: k.volume,
                competition: k.difficulty,
                articleType: k.prompt_type_id,
                title: k.title,
                status: k.is_title_generated ? 'Generated' : 'Pending',
              }));
              setTargetedKeywords(apiTargetedKeywords);
              setEditingKeywords([]);
              setCsvModalOpen(false);
              setCsvKeywords([]);
              setCsvKeywordTypes({});
              setCsvError(null);

              //any one added keywords for is title is generated or not
              const isTitleGenerated =
                response.data.find((k) =>
                  newPairs.map((p) => p.keyword).includes(k.keyword)
                )?.is_title_generated ?? true;

              toast({
                title: isTitleGenerated ? 'Success' : 'Error',
                description:
                  `${newPairs.length} keyword(s) added successfully!` +
                  (!isTitleGenerated
                    ? '(But facing issue in title generation)'
                    : ''),
              });
            } else {
              setCsvError(response.message || 'Failed to add keywords.');
            }
          } catch (error) {
            setCsvError(
              error instanceof Error ? error.message : 'Failed to add keywords.'
            );
          } finally {
            setArticleTypeModalLoading(false);
          }
        }}
        onCancel={() => {
          setCsvModalOpen(false);
          setCsvKeywords([]);
          setCsvKeywordTypes({});
          setCsvError(null);
        }}
      />

      {/* Regenerate Title Modal for Keywords */}
      {pendingKeywordForTitleRegeneration && (
        <RegenerateTitleModal
          open={regenerateTitleModalOpen}
          onOpenChange={(open) => {
            setRegenerateTitleModalOpen(open);
            if (!open) {
              setPendingKeywordForTitleRegeneration(null);
              setRegeneratedOutline('');
            }
          }}
          topicId={pendingKeywordForTitleRegeneration.id}
          currentTitle={pendingKeywordForTitleRegeneration.title ?? ''}
          outline={regeneratedOutline}
          onSaveAndGenerateOutline={async (newTitle: string) => {
            if (!pendingKeywordForTitleRegeneration) return;
            try {
              // Update the keyword with the new title and article type
              const response = await updateArticle(
                pendingKeywordForTitleRegeneration.id,
                {
                  prompt_type:
                    pendingKeywordForTitleRegeneration.articleType || '',
                  name: newTitle,
                }
              );

              if (response.status) {
                toast({
                  title: 'Success',
                  description: 'Title regenerated and saved.',
                });
                // Regenerate outline after title is saved
                try {
                  const outline = await generateOutline(
                    pendingKeywordForTitleRegeneration.id
                  );
                  setRegeneratedOutline(outline);
                  toast({
                    title: 'Outline regenerated',
                    description: 'Outline has been regenerated for this topic.',
                  });
                } catch (outlineError) {
                  toast({
                    title: 'Outline regeneration failed',
                    description:
                      outlineError instanceof Error
                        ? outlineError.message
                        : 'Failed to regenerate outline.',
                    variant: 'destructive',
                  });
                }
                // Do not save keyword or close modal yet
              } else {
                toast({
                  title: 'Error',
                  description: response.message,
                  variant: 'destructive',
                });
              }
            } catch (error) {
              toast({
                title: 'Error',
                description:
                  error instanceof Error
                    ? error.message
                    : 'An unknown error occurred.',
                variant: 'destructive',
              });
            }
          }}
          onFinalSave={async () => {
            if (pendingKeywordForTitleRegeneration) {
              await saveKeywordRow(pendingKeywordForTitleRegeneration.id);
            }
            setRegenerateTitleModalOpen(false);
            setPendingKeywordForTitleRegeneration(null);
            setRegeneratedOutline('');
          }}
        />
      )}
    </div>
  );
}
