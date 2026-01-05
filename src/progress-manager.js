export class ProgressManager {
  constructor() {
    this.progressState = new Map();
  }

  start(progressToken, title, total = null) {
    if (this.progressState.has(progressToken)) {
      throw new Error(`Progress token "${progressToken}" already exists`);
    }

    const progress = {
      title,
      current: 0,
      total,
      startTime: Date.now(),
    };

    this.progressState.set(progressToken, progress);
    return progress;
  }

  update(progressToken, current, total, message) {
    const progress = this.progressState.get(progressToken);
    if (!progress) {
      throw new Error(`Progress token "${progressToken}" not found`);
    }

    progress.current = current;
    if (total !== undefined) {
      progress.total = total;
    }
    if (message !== undefined) {
      progress.message = message;
    }

    return progress;
  }

  complete(progressToken) {
    const progress = this.progressState.get(progressToken);
    if (!progress) {
      throw new Error(`Progress token "${progressToken}" not found`);
    }

    const duration = ((Date.now() - progress.startTime) / 1000).toFixed(2);
    this.progressState.delete(progressToken);
    
    return { progress, duration };
  }

  get(progressToken) {
    return this.progressState.get(progressToken);
  }

  has(progressToken) {
    return this.progressState.has(progressToken);
  }

  clear() {
    this.progressState.clear();
  }
}
