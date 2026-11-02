export async function copyToClipboard(text) {
  const canUseClipboardAPI = navigator.clipboard && window.isSecureContext;
  if (canUseClipboardAPI) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return copyWithFallback(text);
    }
  }
  return copyWithFallback(text);
}
function copyWithFallback(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}
