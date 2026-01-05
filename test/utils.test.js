import { expect } from 'chai';
import { formatProgressText, formatPercentageString, createToolResult } from '../src/utils.js';

describe('Utils', () => {
  describe('formatProgressText', () => {
    it('should format progress with total and percentage', () => {
      expect(formatProgressText(5, 10)).to.equal('5/10 (50%)');
      expect(formatProgressText(3, 10)).to.equal('3/10 (30%)');
      expect(formatProgressText(10, 10)).to.equal('10/10 (100%)');
    });

    it('should format progress without total', () => {
      expect(formatProgressText(5, null)).to.equal('5');
      expect(formatProgressText(42, undefined)).to.equal('42');
    });

    it('should round percentages', () => {
      expect(formatProgressText(1, 3)).to.equal('1/3 (33%)');
      expect(formatProgressText(2, 3)).to.equal('2/3 (67%)');
    });
  });

  describe('formatPercentageString', () => {
    it('should format percentage string with total', () => {
      expect(formatPercentageString(5, 10)).to.equal(' (50%)');
      expect(formatPercentageString(1, 4)).to.equal(' (25%)');
    });

    it('should return empty string without total', () => {
      expect(formatPercentageString(5, null)).to.equal('');
      expect(formatPercentageString(5, undefined)).to.equal('');
    });
  });

  describe('createToolResult', () => {
    it('should create success result', () => {
      const result = createToolResult('Operation successful');
      
      expect(result).to.deep.equal({
        content: [
          {
            type: 'text',
            text: 'Operation successful',
          },
        ],
      });
    });

    it('should create error result', () => {
      const result = createToolResult('Operation failed', true);
      
      expect(result).to.deep.equal({
        content: [
          {
            type: 'text',
            text: 'Operation failed',
          },
        ],
        isError: true,
      });
    });
  });
});
