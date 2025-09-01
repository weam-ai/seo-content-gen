import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';
import {
  Loader2,
  Clock,
  Plus,
  History,
  Edit,
  Trash2,
  Pause,
  Play,
  FileText,
} from 'lucide-react';
import {
  startTimeTracking,
  stopTimeTracking,
  getTimeTrackingStatus,
  getTimeLogs,
  addManualTimeLog,
  updateTimeLog,
  deleteTimeLog,
  TimeLog,
} from '@/lib/services/time-tracking.service';

import { useAuthStore } from '@/stores/auth-store';

interface ArticleTimeTrackerProps {
  articleId: string;
}

const ArticleTimeTracker: React.FC<ArticleTimeTrackerProps> = ({
  articleId,
}) => {
  const { user: currentUser } = useAuthStore();
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [totalTrackedTime, setTotalTrackedTime] = useState(0); // total tracked seconds from API
  const [trackingLoading, setTrackingLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time logs
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<{
    id: string;
    user: string;
    start_time: string;
    end_time: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Note popup state
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{
    note: string;
    user: string;
    date: string;
  } | null>(null);

  // Manual entry fields
  const [manualFromDateTime, setManualFromDateTime] = useState('');
  const [manualToDateTime, setManualToDateTime] = useState('');



  // refreshDataFromServer removed - unused in single-user app

  // Fetch logs and time tracking status
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch time tracking status from API
        const statusData = await getTimeTrackingStatus(articleId);
        setTimerRunning(statusData.status === 'running');
        setTotalTrackedTime(statusData.totalDuration);
      } catch (error: any) {
        console.error('Error fetching time tracking data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch time tracking data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [articleId]);

  useEffect(() => {
    async function fetchLogs() {
      // Fetch time logs from API
      const logsData = await getTimeLogs(articleId);
      setLogs(logsData);
    }
    showHistory && fetchLogs();
  }, [showHistory, articleId]);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handleStart = async () => {
    setTrackingLoading(true);
    try {
      await startTimeTracking(articleId);
      setElapsed(0);
      setTimerRunning(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start time tracking',
        variant: 'destructive',
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleStop = async () => {
    setTrackingLoading(true);
    const currentElapsed = elapsed; // Store current elapsed time

    try {
      const response = await stopTimeTracking(articleId);
      setTimerRunning(false);

      // Update total tracked time from response (includes the session we just stopped)
      if (response.data) {
        setTotalTrackedTime(response.data.totalDuration);
      } else {
        // Fallback: add current elapsed to total if no response data
        setTotalTrackedTime((prev) => prev + currentElapsed);
      }

      // Reset elapsed time after updating total
      setElapsed(0);

      // Refresh logs to show the new entry
      const logsData = await getTimeLogs(articleId);
      setLogs(logsData);
    } catch (error: any) {
      // On error, still update the local total to prevent visual jump
      setTotalTrackedTime((prev) => prev + currentElapsed);
      setTimerRunning(false);
      setElapsed(0);

      toast({
        title: 'Error',
        description: error.message || 'Failed to stop time tracking',
        variant: 'destructive',
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const resetManualForm = () => {
    setManualFromDateTime('');
    setManualToDateTime('');
    setManualNote('');
    setEditingLog(null);
  };

  const handleManualSave = async () => {
    if (!manualFromDateTime || !manualToDateTime) return;

    try {
      if (editingLog) {
        // Update existing log
        await updateTimeLog(editingLog.id, {
          startTime: new Date(manualFromDateTime).toISOString(),
          endTime: new Date(manualToDateTime).toISOString(),
          note: manualNote || undefined,
        });
        toast({
          title: 'Time Log Updated',
          description: 'Time log has been updated successfully.',
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

      // Refresh logs and status
      const [logsData, statusData] = await Promise.all([
        getTimeLogs(articleId),
        getTimeTrackingStatus(articleId),
      ]);
      setLogs(logsData);
      setTotalTrackedTime(statusData.totalDuration);

      setShowManual(false);
      resetManualForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save time log',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);

    const formatForInput = (dateStr: string) => {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60000); // adjust to local time
      return localDate.toISOString().slice(0, 16);
    };

    setManualFromDateTime(formatForInput(log.start_time));
    setManualToDateTime(formatForInput(log.end_time));
    setManualNote(log.note || '');
    setShowManual(true);
  };

  const handleDeleteClick = (log: TimeLog) => {
    setLogToDelete({
      id: log.id,
      user: log.username,
      start_time: log.start_time,
      end_time: log.end_time,
    });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;

    setDeleting(true);
    try {
      await deleteTimeLog(logToDelete.id);

      // Refresh logs and status
      const [logsData, statusData] = await Promise.all([
        getTimeLogs(articleId),
        getTimeTrackingStatus(articleId),
      ]);
      setLogs(logsData);
      setTotalTrackedTime(statusData.totalDuration);

      setShowDeleteConfirm(false);
      setLogToDelete(null);

      toast({
        title: 'Time Log Deleted',
        description: 'Time log has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete time log',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
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

  // Compute total tracked time (from API + current session)
  const totalTrackedSeconds = totalTrackedTime + (timerRunning ? elapsed : 0);
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60) % 60;
    const s = secs % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
  };

  // Helper to format datetime string
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

  // Helper to format duration as 'Xh Ym', never including days
  const formatDuration = (from: string, to: string) => {
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

  // Helper to determine if a log entry is manual or tracked
  const getLogType = (log: TimeLog) => {
    // If the log has a type field, use it; otherwise determine based on other criteria
    // You may need to adjust this logic based on your TimeLog interface
    return log.type || (log.note ? 'manual' : 'tracked');
  };

  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 mb-4 border border-border/40">
      <div className="flex items-center gap-3">
        <button
          onClick={timerRunning ? handleStop : handleStart}
          disabled={trackingLoading}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border ${
            timerRunning
              ? 'bg-red-500 border-red-500 hover:bg-red-600'
              : 'bg-background border-border hover:border-[hsl(var(--razor-primary))] hover:bg-[hsl(var(--razor-primary))]/5'
          } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--razor-primary))]/20 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={timerRunning ? 'Stop timer' : 'Start timer'}
        >
          {trackingLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : timerRunning ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Time Tracked:
          </span>
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatTime(totalTrackedSeconds)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(true)}
          className="h-7 px-2 text-xs hover:bg-background/80"
        >
          <History className="w-3 h-3 mr-1" />
          History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowManual(true);
          }}
          className="h-7 px-2 text-xs hover:bg-background/80"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Manual
        </Button>
      </div>
      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-between mb-4 pr-8">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-[hsl(var(--razor-primary))]" />
              Time Log History
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowManual(true);
              }}
              className="h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Manual
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No time logs yet.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowManual(true);
                }}
                className="h-8 px-4 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Entry
              </Button>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg border border-border/40 overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table className="w-full min-w-[800px]">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/40">
                      <th className="py-3 px-4 text-left font-medium">User</th>
                      <th className="py-3 px-4 text-left font-medium">From</th>
                      <th className="py-3 px-4 text-left font-medium">To</th>
                      <th className="py-3 px-4 text-left font-medium">
                        Duration
                      </th>
                      <th className="py-3 px-4 text-center font-medium">
                        Type
                      </th>
                      <th className="py-3 px-4 text-center font-medium">
                        Note
                      </th>
                      <th className="py-3 px-4 text-center font-medium">
                        Status
                      </th>
                      <th className="py-3 px-4 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-background/80 transition-colors group ${
                          index !== logs.length - 1
                            ? 'border-b border-border/20'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={log.profile_image || '/placeholder-user.jpg'}
                              alt={log.username}
                              className="w-7 h-7 rounded-full object-cover border bg-background"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-user.jpg';
                              }}
                            />
                            <span className="font-medium text-sm text-foreground">
                              {log.username}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDateTime(log.start_time)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDateTime(log.end_time)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex whitespace-nowrap items-center gap-1 bg-[hsl(var(--razor-primary))]/10 text-[hsl(var(--razor-primary))] text-xs font-medium px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" />
                            {formatDuration(log.start_time, log.end_time)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getLogType(log) === 'manual'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {getLogType(log)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {log.note ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNoteClick(log)}
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                              title="View note"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              --
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 justify-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.status === 'running'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {log.status !== 'running' && (
                            <div className="flex gap-1 justify-start">
                              {getLogType(log) === 'manual' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(log)}
                                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {currentUser?._id === log.user_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(log)}
                                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Manual Entry Modal */}
      <Dialog
        open={showManual}
        onOpenChange={(open) => {
          setShowManual(open);
          if (!open) resetManualForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[hsl(var(--razor-primary))]" />
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
                  className="transition-all duration-200 hover:border-[hsl(var(--razor-primary))]/50 focus:border-[hsl(var(--razor-primary))]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">To</label>
                <Input
                  type="datetime-local"
                  value={manualToDateTime}
                  onChange={(e) => setManualToDateTime(e.target.value)}
                  className="transition-all duration-200 hover:border-[hsl(var(--razor-primary))]/50 focus:border-[hsl(var(--razor-primary))]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Duration
              </label>
              <Input
                min={0}
                value={formatDuration(manualFromDateTime, manualToDateTime)}
                readOnly
                className="transition-all duration-200 hover:border-[hsl(var(--razor-primary))]/50 focus:border-[hsl(var(--razor-primary))] bg-muted/50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Note (optional)
              </label>
              <Textarea
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="transition-all duration-200 hover:border-[hsl(var(--razor-primary))]/50 focus:border-[hsl(var(--razor-primary))] resize-none"
                placeholder="Add a note about this time entry..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleManualSave}
                className="razor-gradient flex-1"
                disabled={!manualFromDateTime || !manualToDateTime}
              >
                {editingLog ? 'Save Changes' : 'Add Entry'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowManual(false);
                  resetManualForm();
                }}
                className="flex-1"
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
            <FileText className="w-5 h-5 text-[hsl(var(--razor-primary))]" />
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
                  className="px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setLogToDelete(null);
        }}
        title="Delete Time Log?"
        description={
          logToDelete
            ? `Are you sure you want to delete the ${formatDuration(
                logToDelete.start_time,
                logToDelete.end_time
              )} time log by ${logToDelete.user}? This action cannot be undone.`
            : 'Are you sure you want to delete this time log? This action cannot be undone.'
        }
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      />
    </div>
  );
};

export default ArticleTimeTracker;
