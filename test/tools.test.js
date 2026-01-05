import { expect } from 'chai';
import { createTools } from '../src/tools.js';

describe('Tools', () => {
  let tools;
  let progressManager;
  let mockNotifier;
  let notifications;

  beforeEach(() => {
    notifications = [];
    mockNotifier = {
      notify: (config) => {
        notifications.push(config);
      },
    };
    
    const result = createTools(mockNotifier);
    tools = result.tools;
    progressManager = result.progressManager;
  });

  describe('notify tool', () => {
    it('should send notification and return success', async () => {
      const result = await tools.notify.handler({
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0]).to.deep.include({
        title: 'Test Title',
        message: 'Test Message',
        sound: false,
        wait: false,
      });

      expect(result.content[0].text).to.equal('Notification sent: "Test Title"');
    });

    it('should send notification with sound', async () => {
      await tools.notify.handler({
        title: 'Test',
        message: 'Test',
        sound: true,
      });

      expect(notifications[0].sound).to.equal('default');
    });
  });

  describe('start_progress tool', () => {
    it('should start progress tracking', async () => {
      const result = await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Test Task',
        total: 10,
      });

      expect(result.content[0].text).to.equal('Progress started: "Test Task" (token: token1)');
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0]).to.deep.include({
        title: 'Test Task',
        message: '0/10 (0%)',
      });
    });

    it('should start progress without total', async () => {
      const result = await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Test Task',
      });

      expect(result.content[0].text).to.equal('Progress started: "Test Task" (token: token1)');
      expect(notifications[0].message).to.equal('0');
    });

    it('should return error if token already exists', async () => {
      await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Test Task',
      });

      const result = await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Another Task',
      });

      expect(result.isError).to.be.true;
      expect(result.content[0].text).to.equal('Progress token "token1" already exists');
    });
  });

  describe('update_progress tool', () => {
    beforeEach(async () => {
      await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Test Task',
        total: 10,
      });
      notifications = [];
    });

    it('should update progress', async () => {
      const result = await tools.update_progress.handler({
        progressToken: 'token1',
        current: 5,
      });

      expect(result.content[0].text).to.equal('Progress updated: 5/10 (50%)');
      expect(notifications[0]).to.deep.include({
        title: 'Test Task',
        message: '5/10 (50%)',
      });
    });

    it('should update progress with message', async () => {
      const result = await tools.update_progress.handler({
        progressToken: 'token1',
        current: 3,
        message: 'Processing files...',
      });

      expect(result.content[0].text).to.equal('Progress updated: 3/10 (30%) - Processing files...');
      expect(notifications[0].message).to.equal('3/10 (30%) - Processing files...');
    });

    it('should update total if provided', async () => {
      await tools.update_progress.handler({
        progressToken: 'token1',
        current: 5,
        total: 20,
      });

      expect(notifications[0].message).to.equal('5/20 (25%)');
    });

    it('should return error if token not found', async () => {
      const result = await tools.update_progress.handler({
        progressToken: 'invalid',
        current: 5,
      });

      expect(result.isError).to.be.true;
      expect(result.content[0].text).to.equal('Progress token "invalid" not found');
    });
  });

  describe('complete_progress tool', () => {
    beforeEach(async () => {
      await tools.start_progress.handler({
        progressToken: 'token1',
        title: 'Test Task',
        total: 10,
      });
      notifications = [];
    });

    it('should complete progress', async () => {
      const result = await tools.complete_progress.handler({
        progressToken: 'token1',
      });

      expect(result.content[0].text).to.match(/^Progress completed: "Test Task" \(\d+\.\d{2}s\)$/);
      expect(notifications[0].title).to.equal('✓ Test Task');
      expect(notifications[0].message).to.match(/^Completed in \d+\.\d{2}s$/);
      expect(notifications[0].sound).to.equal('default');
    });

    it('should complete progress with custom message', async () => {
      const result = await tools.complete_progress.handler({
        progressToken: 'token1',
        message: 'All done!',
      });

      expect(result.content[0].text).to.match(/^Progress completed: "Test Task" \(\d+\.\d{2}s\) - All done!$/);
      expect(notifications[0].message).to.equal('All done!');
    });

    it('should remove progress from state', async () => {
      await tools.complete_progress.handler({
        progressToken: 'token1',
      });

      expect(progressManager.has('token1')).to.be.false;
    });

    it('should return error if token not found', async () => {
      const result = await tools.complete_progress.handler({
        progressToken: 'invalid',
      });

      expect(result.isError).to.be.true;
      expect(result.content[0].text).to.equal('Progress token "invalid" not found');
    });
  });
});
