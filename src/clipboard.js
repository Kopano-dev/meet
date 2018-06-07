function legacyWriteToClipboard(text) {
  // NOTE(longsleep): Old style clipboard stuff required until new async
  // https://www.w3.org/TR/clipboard-apis/#async-clipboard-api api is widely available.

  return new Promise((resolve, reject) => {
    const e = document.createElement('input');
    e.readonly = true;
    e.spellcheck = false;
    // Set styles.
    e.style.position = 'fixed';
    e.style.top = 0;
    e.style.left = 0;
    e.style.maxHeight = '100%';
    e.style.maxWidth = '100%';
    e.style.padding = 0;
    e.style.border = 'none';
    e.style.outline = 'none';
    e.style.boxShadow = 'none';
    e.style.background = 'transparent';
    e.style.color = 'transparent';

    // Set text.
    e.value = text;

    // Remember.
    const activeElement = document.activeElement;

    // Append, focus and select.
    document.body.appendChild(e);
    e.focus();
    e.select();

    let success = false;
    let result;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      result = err;
    }

    // Restore focus.
    if (activeElement !== null) {
      activeElement.focus();
    }

    // Remove element again.
    document.body.removeChild(e);

    if (success) {
      resolve();
    } else {
      if (result === undefined) {
        result = new Error('copy to clipboard failed');
      }
      reject(result);
    }
  });
}

export async function writeTextToClipboard(text) {
  return legacyWriteToClipboard(text);
}
