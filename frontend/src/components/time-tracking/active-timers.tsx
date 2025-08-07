'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface TimeSession {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  pausedDuration?: number; // Total paused time in milliseconds
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ActiveTimersProps {
  timeSessions: TimeSession[];
  onTimerAction: (action: string, sessionId: string) => Promise<void>;
  currentUserId: string;
}

export function ActiveTimers({ timeSessions, onTimerAction, currentUserId }: ActiveTimersProps) {
  const [runningTimers, setRunningTimers] = useState<{ [key: string]: number }>({});

  // Filter active and paused sessions for current user
  const activeSessions = timeSessions.filter(
    (session) => 
      session.user.id === currentUserId && 
      (session.status === 'RUNNING' || session.status === 'PAUSED')
  );

  // Update running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newRunningTimers: { [key: string]: number } = {};
      
      activeSessions.forEach((session) => {
        if (session.status === 'RUNNING') {
          const startTime = new Date(session.startTime).getTime();
          const pausedDuration = session.pausedDuration || 0;
          // Calculate actual running time by subtracting paused time
          newRunningTimers[session.id] = now - startTime - pausedDuration;
        }
      });
      
      setRunningTimers(newRunningTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessions]);

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationFromStart = (startTime: string, endTime?: string, pausedDuration: number = 0) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime() - pausedDuration;
    return formatDuration(Math.max(0, durationMs)); // Ensure non-negative duration
  };

  const handleAction = async (action: string, sessionId: string) => {
    try {
      await onTimerAction(action, sessionId);
    } catch (error) {
      toast.error(`Failed to ${action} timer`);
    }
  };

  if (activeSessions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Timers</h3>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No active timers</p>
          <p className="text-sm text-gray-400">Start a timer to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Active Timers</h3>
      <div className="space-y-4">
        {activeSessions.map((session) => (
          <div key={session.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`h-3 w-3 rounded-full ${
                    session.status === 'RUNNING' ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <h4 className="text-sm font-medium text-gray-900">
                    {session.project?.name || `Project ${session.projectId}`}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  {session.description || 'No description'}
                </p>
                <p className="text-xs text-gray-400">
                  Started: {new Date(session.startTime).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-mono text-gray-900">
                    {session.status === 'RUNNING' 
                      ? formatDuration(runningTimers[session.id] || 0)
                      : formatDurationFromStart(session.startTime, session.endTime, session.pausedDuration || 0)
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.status === 'RUNNING' ? 'Running' : 'Paused'}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {session.status === 'RUNNING' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('pause', session.id)}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('stop', session.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('resume', session.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('stop', session.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 