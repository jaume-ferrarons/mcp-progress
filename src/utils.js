export function formatProgressText(current, total) {
  if (total) {
    const percentage = Math.round((current / total) * 100);
    return `${current}/${total} (${percentage}%)`;
  }
  return `${current}`;
}

export function formatPercentageString(current, total) {
  if (total) {
    const percentage = Math.round((current / total) * 100);
    return ` (${percentage}%)`;
  }
  return '';
}

export function createToolResult(text, isError = false) {
  const result = {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
  
  if (isError) {
    result.isError = true;
  }
  
  return result;
}
