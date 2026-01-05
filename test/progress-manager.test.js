import { expect } from 'chai';
import { ProgressManager } from '../src/progress-manager.js';

describe('ProgressManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ProgressManager();
  });

  describe('start', () => {
    it('should start a new progress tracking', () => {
      const progress = manager.start('token1', 'Test Task', 10);
      
      expect(progress).to.deep.include({
        title: 'Test Task',
        current: 0,
        total: 10,
      });
      expect(progress.startTime).to.be.a('number');
    });

    it('should start progress without total', () => {
      const progress = manager.start('token1', 'Test Task');
      
      expect(progress).to.deep.include({
        title: 'Test Task',
        current: 0,
        total: null,
      });
    });

    it('should throw error if token already exists', () => {
      manager.start('token1', 'Test Task');
      
      expect(() => manager.start('token1', 'Another Task')).to.throw(
        'Progress token "token1" already exists'
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      manager.start('token1', 'Test Task', 10);
    });

    it('should update progress current value', () => {
      const progress = manager.update('token1', 5);
      
      expect(progress.current).to.equal(5);
    });

    it('should update total if provided', () => {
      const progress = manager.update('token1', 5, 20);
      
      expect(progress.current).to.equal(5);
      expect(progress.total).to.equal(20);
    });

    it('should update message if provided', () => {
      const progress = manager.update('token1', 5, undefined, 'Processing...');
      
      expect(progress.message).to.equal('Processing...');
    });

    it('should throw error if token not found', () => {
      expect(() => manager.update('invalid', 5)).to.throw(
        'Progress token "invalid" not found'
      );
    });
  });

  describe('complete', () => {
    beforeEach(() => {
      manager.start('token1', 'Test Task', 10);
    });

    it('should complete progress and return duration', () => {
      const result = manager.complete('token1');
      
      expect(result.progress).to.deep.include({
        title: 'Test Task',
        current: 0,
        total: 10,
      });
      expect(result.duration).to.match(/^\d+\.\d{2}$/);
    });

    it('should remove progress from state', () => {
      manager.complete('token1');
      
      expect(manager.has('token1')).to.be.false;
    });

    it('should throw error if token not found', () => {
      expect(() => manager.complete('invalid')).to.throw(
        'Progress token "invalid" not found'
      );
    });
  });

  describe('get', () => {
    it('should return progress if exists', () => {
      manager.start('token1', 'Test Task');
      const progress = manager.get('token1');
      
      expect(progress).to.exist;
      expect(progress.title).to.equal('Test Task');
    });

    it('should return undefined if not exists', () => {
      expect(manager.get('invalid')).to.be.undefined;
    });
  });

  describe('has', () => {
    it('should return true if progress exists', () => {
      manager.start('token1', 'Test Task');
      
      expect(manager.has('token1')).to.be.true;
    });

    it('should return false if progress does not exist', () => {
      expect(manager.has('invalid')).to.be.false;
    });
  });

  describe('clear', () => {
    it('should clear all progress tracking', () => {
      manager.start('token1', 'Task 1');
      manager.start('token2', 'Task 2');
      
      manager.clear();
      
      expect(manager.has('token1')).to.be.false;
      expect(manager.has('token2')).to.be.false;
    });
  });
});
