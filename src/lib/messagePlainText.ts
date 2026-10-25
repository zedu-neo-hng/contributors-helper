/** Serialize the complete rendered Markdown, independent of selection or viewport. */
export function messagePlainText(root: HTMLElement): string {
  function read(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement)) return '';
    const children = () => Array.from(node.childNodes)
      .filter(child => !(child.nodeType === Node.TEXT_NODE && /^\n+$/.test(child.textContent || '')
        && /^(DIV|UL|OL|LI|BLOCKQUOTE)$/.test(node.tagName)))
      .map(read).join('');
    switch (node.tagName) {
      case 'BR': return '\n';
      case 'PRE': return `${node.textContent || ''}\n\n`;
      case 'A': {
        const label = children();
        const href = node.getAttribute('href');
        return href && href !== label ? `${label} (${href})` : label;
      }
      case 'IMG': return node.getAttribute('alt') || '';
      case 'OL':
      case 'UL': return `${children()}\n`;
      case 'LI': {
        const parent = node.parentElement;
        const index = parent ? Array.from(parent.children).indexOf(node) : 0;
        const start = Number(parent?.getAttribute('start') || 1);
        const prefix = parent?.tagName === 'OL' ? `${start + index}. ` : '• ';
        return `${prefix}${children().trim()}\n`;
      }
      case 'P':
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
      case 'BLOCKQUOTE': return `${children()}\n\n`;
      case 'HR': return '---\n\n';
      default: return children();
    }
  }
  // Remove boundary line breaks only: leading indentation in code is meaningful.
  return read(root).replace(/^\n+|\n+$/g, '');
}
