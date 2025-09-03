import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  Clock,
  Edit,
  Trash2,
  Plus,
  FileText,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import {
  ExportToExcel,
  ExportToExcelHandle,
} from '@/components/ui/ExportToExcel';
import useEditor from '../../hooks/useEditor';
import {
  getTimeLogs,
  addManualTimeLog,
  updateTimeLog,
  deleteTimeLog,
  TimeLog,
} from '@/lib/services/time-tracking.service';
import { useAuthStore } from '@/stores/auth-store';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const TimeSection: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const currentUser = useAuthStore.getState().getUser();
  const {
    article,
    isTimeTracking,
    totalTimeSeconds,
    startTimeTracking,
    pauseTimeTracking,
    isLoading,
    error,
  } = useEditor();
  const [timeEntries, setTimeEntries] = useState<TimeLog[]>([]);
  const [showAddManual, setShowAddManual] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Manual entry fields
  const [manualFromDateTime, setManualFromDateTime] = useState('');
  const [manualToDateTime, setManualToDateTime] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

  // Note popup state
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{
    note: string;
    user: string;
    date: string;
  } | null>(null);

  // Export ref
  const exportRef = useRef<ExportToExcelHandle>(null);

  // Load time logs from API
  const loadTimeLogs = async () => {
    if (!articleId) return;

    try {
      setIsLoadingEntries(true);
      const logs = await getTimeLogs(articleId);
      setTimeEntries(logs);
    } catch (err) {
      console.error('Failed to load time logs:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Load time logs on component mount and when articleId changes
  useEffect(() => {
    loadTimeLogs();
  }, [articleId, isTimeTracking]);

  const handleStartTracking = async () => {
    if (!articleId) return;
    await startTimeTracking(articleId);
  };

  const handlePauseAndSave = async () => {
    if (!articleId) return;
    await pauseTimeTracking(articleId);
    // Reload time logs to get the latest entries
    await loadTimeLogs();
  };

  // Helper functions
  const resetManualForm = () => {
    setManualFromDateTime('');
    setManualToDateTime('');
    setManualNote('');
    setEditingLog(null);
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return '--';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '--';
    return d
      .toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(',', '');
  };

  const formatDurationFromDates = (from: string, to: string) => {
    if (!from || !to) return '--';
    const fromDate = new Date(from);
    const toDate = new Date(to);
    let diff = Math.max(0, toDate.getTime() - fromDate.getTime()); // milliseconds

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours ? `${hours}h` : '',
      minutes || (!hours && !seconds) ? `${minutes}m` : '',
      seconds || (!hours && !minutes) ? `${seconds}s` : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const addManualEntry = async () => {
    if (!manualFromDateTime || !manualToDateTime || !articleId) return;

    try {
      if (editingLog) {
        // Update existing log
        await updateTimeLog(editingLog.id, {
          startTime: new Date(manualFromDateTime).toISOString(),
          endTime: new Date(manualToDateTime).toISOString(),
          note: manualNote || undefined,
        });
      } else {
        // Add new manual log
        await addManualTimeLog({
          articleId,
          startTime: new Date(manualFromDateTime).toISOString(),
          endTime: new Date(manualToDateTime).toISOString(),
          note: manualNote || undefined,
        });
      }

      // Reload time logs to get the latest entries
      await loadTimeLogs();
      setShowAddManual(false);
      resetManualForm();
    } catch (err) {
      console.error('Failed to save manual time log:', err);
    }
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);

    const formatForInput = (dateStr: string) => {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60000);
      return localDate.toISOString().slice(0, 16);
    };

    setManualFromDateTime(formatForInput(log.start_time));
    setManualToDateTime(formatForInput(log.end_time));
    setManualNote(log.note || '');
    setShowAddManual(true);
  };

  const handleNoteClick = (log: TimeLog) => {
    if (!log.note) return;

    setSelectedNote({
      note: log.note,
      user: log.username,
      date: formatDateTime(log.start_time),
    });
    setShowNotePopup(true);
  };

  const handleDeleteTimeLog = async (timelogId: string) => {
    try {
      await deleteTimeLog(timelogId);
      await loadTimeLogs(); // Reload after deletion
    } catch (err) {
      console.error('Failed to delete time log:', err);
    }
  };

  // Prepare data for Excel export
  const prepareExportData = () => {
    return timeEntries.map((entry) => {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);
      const duration = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      const formatDurationForExport = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      return {
        user: entry.username,
        type: entry.type,
        status: entry.status,
        startDate: startTime.toLocaleDateString('en-GB'),
        startTime: startTime.toLocaleTimeString('en-GB', { hour12: false }),
        endDate:
          entry.status !== 'running'
            ? endTime.toLocaleDateString('en-GB')
            : 'N/A',
        endTime:
          entry.status !== 'running'
            ? endTime.toLocaleTimeString('en-GB', { hour12: false })
            : 'N/A',
        duration:
          entry.status !== 'running'
            ? formatDurationForExport(duration)
            : 'N/A',
        durationSeconds: entry.status !== 'running' ? duration : 0,
        note: entry.note || '',
      };
    });
  };

  const exportColumns = [
    { header: 'User', accessor: 'user' },
    { header: 'Type', accessor: 'type' },
    { header: 'Status', accessor: 'status' },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'Start Time', accessor: 'startTime' },
    { header: 'End Date', accessor: 'endDate' },
    { header: 'End Time', accessor: 'endTime' },
    { header: 'Duration (HH:MM:SS)', accessor: 'duration' },
    { header: 'Duration (Seconds)', accessor: 'durationSeconds' },
    { header: 'Note', accessor: 'note' },
  ];

  const handleExport = () => {
    if (exportRef.current) {
      exportRef.current.exportNow();
    }
  };

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Current Session */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Current Session</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-2xl font-mono font-bold">
            {formatDuration(totalTimeSeconds)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isTimeTracking ? 'Tracking active' : 'Not tracking'}
          </p>
        </div>

        <div className="flex gap-1.5">
          {!isTimeTracking ? (
            <Button
              onClick={handleStartTracking}
              size="sm"
              className="flex-1 h-7"
              disabled={isLoading || !articleId}
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePauseAndSave}
              variant="outline"
              size="sm"
              className="flex-1 h-7"
              disabled={isLoading || !articleId}
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause & Save
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-xs text-red-500 text-center mt-2">{error}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddManual(true)}
          className="flex-1 h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Manual Entry
        </Button>

        <ExportToExcel
          ref={exportRef}
          columns={exportColumns}
          data={prepareExportData()}
          filename={`time-logs-${
            article?.title
              ?.replace(/[^a-zA-Z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .toLowerCase() ||
            articleId ||
            'export'
          }-${new Date().toISOString().split('T')[0]}.xlsx`}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="h-7 w-7 p-0"
            disabled={timeEntries.length === 0}
            title={
              timeEntries.length > 0
                ? `Export ${timeEntries.length} time log${
                    timeEntries.length !== 1 ? 's' : ''
                  } to Excel`
                : 'No time logs to export'
            }
          >
            <Download className="h-3 w-3" />
          </Button>
        </ExportToExcel>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground">
            Recent Sessions
          </span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {timeEntries.length}
          </span>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--border) / 0.3) transparent',
          }}
        >
          {isLoadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No sessions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Start tracking to see history
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pr-1">
              {timeEntries.map((entry) => {
                const startTime = new Date(entry.start_time);
                const endTime = new Date(entry.end_time);
                const duration = Math.floor(
                  (endTime.getTime() - startTime.getTime()) / 1000
                );

                // Check if user has edit/delete permissions
                const canEdit =
                  entry.type === 'manual' && entry.status !== 'running';
                const canDelete =
                  currentUser?.id === entry.user_id &&
                  entry.status !== 'running';
                const hasActions = canEdit || canDelete;

                return (
                  <div
                    key={entry.id}
                    className={`group relative flex items-start gap-2.5 p-2 rounded-md hover:bg-accent/20 transition-all duration-150 ${
                      entry.status === 'running'
                        ? 'bg-orange-50/30 border border-orange-200/50'
                        : 'border border-transparent'
                    }`}
                  >
                    {/* User Avatar with Status Indicator */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-background ${
                          entry.status === 'running'
                            ? 'bg-orange-500 animate-pulse'
                            : entry.type === 'manual'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs font-medium text-foreground truncate">
                            {entry.note || 'Writing'}
                          </span>
                          {entry.note && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleNoteClick(entry)}
                              className="h-3 w-3 p-0 hover:bg-blue-100 hover:text-blue-600 opacity-60 hover:opacity-100 flex-shrink-0"
                              title="View note"
                            >
                              <FileText className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium ${
                              entry.type === 'manual'
                                ? 'bg-blue-100/80 text-blue-700'
                                : 'bg-green-100/80 text-green-700'
                            }`}
                          >
                            {entry.status === 'running'
                              ? 'Tracking'
                              : entry.type}
                          </span>

                          {/* Actions Menu */}
                          {hasActions && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-150"
                                  title="More actions"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                {entry.note && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleNoteClick(entry)}
                                    >
                                      <FileText className="h-3 w-3 mr-2" />
                                      View Note
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {canEdit && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(entry)}
                                  >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteTimeLog(entry.id)
                                    }
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* Time Range Row */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0">
                          <span className="font-medium flex-shrink-0">
                            {entry.status === 'running' ? 'Started:' : 'From:'}
                          </span>
                          <span className="truncate">
                            {startTime.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}{' '}
                            {startTime.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-center h-5 flex-shrink-0 ml-2">
                          {entry.status !== 'running' && (
                            <span className="text-xs font-mono text-primary font-medium leading-none">
                              {(() => {
                                const hours = Math.floor(duration / 3600);
                                const minutes = Math.floor(
                                  (duration % 3600) / 60
                                );
                                const seconds = duration % 60;

                                if (hours > 0) {
                                  return `${hours}h:${String(minutes).padStart(
                                    2,
                                    '0'
                                  )}m:${String(seconds).padStart(2, '0')}s`;
                                } else if (minutes > 0) {
                                  return `${minutes}m:${String(
                                    seconds
                                  ).padStart(2, '0')}s`;
                                } else {
                                  return `${seconds}s`;
                                }
                              })()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* End Time Row - Only show for completed entries */}
                      {entry.status !== 'running' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium flex-shrink-0">To:</span>
                          <span className="truncate">
                            {endTime.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}{' '}
                            {endTime.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Dialog
        open={showAddManual}
        onOpenChange={(open) => {
          setShowAddManual(open);
          if (!open) resetManualForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {editingLog ? 'Edit Time Log' : 'Add Time Log'}
          </DialogTitle>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">From</label>
                <Input
                  type="datetime-local"
                  value={manualFromDateTime}
                  onChange={(e) => setManualFromDateTime(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">To</label>
                <Input
                  type="datetime-local"
                  value={manualToDateTime}
                  onChange={(e) => setManualToDateTime(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Duration
              </label>
              <Input
                value={formatDurationFromDates(
                  manualFromDateTime,
                  manualToDateTime
                )}
                readOnly
                className="h-8 text-sm bg-muted/50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Note (optional)
              </label>
              <Textarea
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="resize-none text-sm"
                placeholder="Add a note about this time entry..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={addManualEntry}
                className="flex-1 h-8 text-sm"
                disabled={!manualFromDateTime || !manualToDateTime}
              >
                {editingLog ? 'Save Changes' : 'Add Entry'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddManual(false);
                  resetManualForm();
                }}
                className="flex-1 h-8 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Popup Dialog */}
      <Dialog
        open={showNotePopup}
        onOpenChange={(open) => {
          setShowNotePopup(open);
          if (!open) setSelectedNote(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Time Log Note
          </DialogTitle>

          {selectedNote && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{selectedNote.user}</span>
                <span>•</span>
                <span>{selectedNote.date}</span>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/40">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedNote.note}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNotePopup(false)}
                  className="px-4 h-8 text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
