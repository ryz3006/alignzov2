# Paused Duration Logic Implementation

## Overview

This document details the implementation of accurate timer duration calculation that properly accounts for paused time periods. The previous implementation incorrectly calculated duration from the start time, ignoring paused periods.

## Problem Statement

**Issue**: When a timer was paused and resumed, the duration calculation continued from the original start time, effectively ignoring the paused periods.

**Example**:
- Timer starts at 9:00 AM
- Timer pauses at 10:00 AM (1 hour of work)
- Timer resumes at 11:00 AM (1 hour pause)
- Timer stops at 12:00 PM
- **Incorrect calculation**: 3 hours (9:00 AM to 12:00 PM)
- **Correct calculation**: 2 hours (1 hour before pause + 1 hour after resume)

## Solution Architecture

### 1. Database Schema Changes

**Added Field**: `pausedDuration` to `TimeSession` model
```prisma
model TimeSession {
  // ... existing fields
  pausedDuration  Int  @default(0) // Total paused time in milliseconds
  metadata        Json @default("{}")
  // ... other fields
}
```

**Migration SQL**:
```sql
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS "pausedDuration" INTEGER DEFAULT 0;
```

### 2. Backend Logic Implementation

#### Pause Operation
```typescript
async pause(id: string, userId: string) {
  const timeSession = await this.findOne(id, userId, 'EMPLOYEE');
  
  if (timeSession.status !== TimeSessionStatus.RUNNING) {
    throw new ForbiddenException('Only running time sessions can be paused');
  }

  const currentPausedDuration = timeSession.pausedDuration || 0;
  const pauseStartTime = new Date();
  
  return await this.prisma.timeSession.update({
    where: { id },
    data: {
      status: TimeSessionStatus.PAUSED,
      endTime: pauseStartTime,
      pausedDuration: currentPausedDuration, // Preserve existing paused time
      metadata: {
        ...timeSession.metadata,
        pauseStartTime: pauseStartTime.toISOString(), // Record pause start
      },
    },
    // ... include relations
  });
}
```

#### Resume Operation
```typescript
async resume(id: string, userId: string) {
  const timeSession = await this.findOne(id, userId, 'EMPLOYEE');
  
  if (timeSession.status !== TimeSessionStatus.PAUSED) {
    throw new ForbiddenException('Only paused time sessions can be resumed');
  }

  // Calculate additional paused time since last pause
  const pauseStartTime = timeSession.metadata?.pauseStartTime;
  let additionalPausedTime = 0;
  
  if (pauseStartTime) {
    const pauseStart = new Date(pauseStartTime);
    const resumeTime = new Date();
    additionalPausedTime = resumeTime.getTime() - pauseStart.getTime();
  }

  // Update total paused duration
  const totalPausedDuration = (timeSession.pausedDuration || 0) + additionalPausedTime;

  return await this.prisma.timeSession.update({
    where: { id },
    data: {
      status: TimeSessionStatus.RUNNING,
      endTime: null, // Clear end time
      pausedDuration: totalPausedDuration,
      metadata: {
        ...timeSession.metadata,
        pauseStartTime: null, // Clear pause start time
      },
    },
    // ... include relations
  });
}
```

#### Duration Calculation
```typescript
// For completed sessions
const actualDuration = endTime.getTime() - startTime.getTime() - pausedDuration;

// For running sessions (real-time)
const runningTime = Date.now() - startTime.getTime() - pausedDuration;
```

### 3. Frontend Implementation

#### Real-time Timer Updates
```typescript
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
```

#### Duration Formatting
```typescript
const formatDuration = (startTime: string, endTime?: string, pausedDuration: number = 0) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end.getTime() - start.getTime() - pausedDuration;
  const seconds = Math.floor(Math.max(0, durationMs) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

### 4. Optimistic Updates

#### Timer Actions
```typescript
onMutate: async ({ action, sessionId }) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['timeSessions'] });

  // Snapshot previous value
  const previousTimeSessions = queryClient.getQueryData(['timeSessions', currentPage, searchTerm, statusFilter]);

  // Optimistically update
  queryClient.setQueryData(['timeSessions', currentPage, searchTerm, statusFilter], (old: any) => {
    if (!old?.data) return old;
    
    const updatedData = old.data.map((session: TimeSession) => {
      if (session.id === sessionId) {
        if (action === 'pause') {
          return { 
            ...session, 
            status: 'PAUSED', 
            endTime: new Date().toISOString(),
            metadata: {
              ...session.metadata,
              pauseStartTime: new Date().toISOString(),
            }
          };
        } else if (action === 'resume') {
          // Calculate additional paused time
          const pauseStartTime = session.metadata?.pauseStartTime;
          let additionalPausedTime = 0;
          
          if (pauseStartTime) {
            const pauseStart = new Date(pauseStartTime);
            const resumeTime = new Date();
            additionalPausedTime = resumeTime.getTime() - pauseStart.getTime();
          }
          
          const totalPausedDuration = (session.pausedDuration || 0) + additionalPausedTime;
          
          return { 
            ...session, 
            status: 'RUNNING', 
            endTime: null,
            pausedDuration: totalPausedDuration,
            metadata: {
              ...session.metadata,
              pauseStartTime: null,
            }
          };
        }
      }
      return session;
    });

    return { ...old, data: updatedData };
  });

  return { previousTimeSessions };
}
```

### 5. Work Log Conversion

#### Accurate Duration for Work Logs
```typescript
async convertToWorkLog(id: string, userId: string) {
  const timeSession = await this.findOne(id, userId, 'EMPLOYEE');

  if (timeSession.status !== TimeSessionStatus.COMPLETED) {
    throw new ForbiddenException('Only completed time sessions can be converted to work logs');
  }

  if (!timeSession.endTime) {
    throw new ForbiddenException('Time session must have an end time to convert to work log');
  }

  // Calculate duration in seconds, accounting for paused time
  const startTime = timeSession.startTime.getTime();
  const endTime = timeSession.endTime.getTime();
  const pausedDuration = timeSession.pausedDuration || 0;
  const actualDuration = Math.max(0, endTime - startTime - pausedDuration);
  const durationInSeconds = Math.floor(actualDuration / 1000);

  // Create work log with accurate duration
  const workLog = await this.prisma.workLog.create({
    data: {
      userId: timeSession.userId,
      projectId: timeSession.projectId,
      ticketId: timeSession.ticketId,
      description: timeSession.description || 'Time session converted to work log',
      duration: durationInSeconds, // Accurate duration
      startTime: timeSession.startTime,
      endTime: timeSession.endTime,
      isBillable: true,
      importSource: 'time_session',
      importId: timeSession.id,
    },
    // ... include relations
  });

  // Delete the time session after conversion
  await this.prisma.timeSession.delete({
    where: { id: timeSession.id },
  });

  return workLog;
}
```

## Data Flow

### 1. Timer Lifecycle
```
Start Timer → Running → Pause → Paused → Resume → Running → Stop → Completed
     ↓           ↓        ↓       ↓        ↓         ↓       ↓        ↓
pausedDuration=0  ↓   pauseStartTime  ↓  calculate additional  ↓  final duration
                  ↓   in metadata     ↓  paused time          ↓  calculation
```

### 2. Duration Calculation Flow
```
Total Elapsed Time = endTime - startTime
Paused Time = pausedDuration (accumulated from all pause periods)
Actual Working Time = Total Elapsed Time - Paused Time
```

### 3. Multiple Pause Cycles
```
Timer Start → Work → Pause → Wait → Resume → Work → Pause → Wait → Resume → Work → Stop
     ↓         ↓      ↓      ↓       ↓        ↓      ↓      ↓       ↓        ↓      ↓
pausedDuration=0  ↓  pause1  ↓  accumulate  ↓  pause2  ↓  accumulate  ↓  final
                  ↓  start   ↓  paused time  ↓  start   ↓  paused time  ↓  duration
```

## Testing Scenarios

### 1. Single Pause/Resume
- Start timer at 9:00 AM
- Pause at 10:00 AM (1 hour work)
- Resume at 11:00 AM (1 hour pause)
- Stop at 12:00 PM (1 hour work)
- **Expected**: 2 hours total work time

### 2. Multiple Pause/Resume Cycles
- Start timer at 9:00 AM
- Pause at 9:30 AM (30 min work)
- Resume at 10:00 AM (30 min pause)
- Pause at 10:30 AM (30 min work)
- Resume at 11:00 AM (30 min pause)
- Stop at 11:30 AM (30 min work)
- **Expected**: 1.5 hours total work time

### 3. Long Pause Periods
- Start timer at 9:00 AM
- Pause at 10:00 AM (1 hour work)
- Resume at 2:00 PM (4 hour pause)
- Stop at 3:00 PM (1 hour work)
- **Expected**: 2 hours total work time

## Benefits

1. **Accurate Time Tracking**: Users see actual working time, not total elapsed time
2. **Multiple Pause Support**: Correctly handles multiple pause/resume cycles
3. **Consistent Display**: All duration displays use the same logic
4. **Work Log Accuracy**: Converted work logs have correct duration
5. **User Trust**: Users can rely on the timer accuracy for billing and reporting

## Migration Considerations

1. **Existing Data**: Existing time sessions will have `pausedDuration = 0`
2. **Backward Compatibility**: No breaking changes to existing functionality
3. **Gradual Rollout**: New logic applies to new sessions, existing sessions remain unchanged

## Future Enhancements

1. **Pause History**: Track individual pause periods for detailed analytics
2. **Auto-pause**: Automatically pause timers after inactivity
3. **Pause Notifications**: Alert users about long pause periods
4. **Pause Analytics**: Reports on pause patterns and productivity insights 