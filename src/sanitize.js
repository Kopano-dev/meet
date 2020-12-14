import * as DOMPurify from 'dompurify';

import linkifyHtml from 'linkifyjs/html';

const LINKIFY_OPTIONS = {
  defaultProtocol: 'https',
  className: null,
};

// TODO(longsleep): Use something on another domain, load from config.
const PROXY = '/api/prxy/v0/f?u=';
const ATTRIBUTES = ['action', 'background', 'href', 'poster', 'src'];

function proxyAttribute(url) {
  if (/^data:image\//.test(url)) {
    return url;
  } else {
    return PROXY+encodeURIComponent(url);
  }
}

DOMPurify.addHook('afterSanitizeAttributes', function(node) {
  // Add a hook to enforce proxy for all HTTP requests except links.
  if (!node.nodeName || node.nodeName !== 'A') {
    for(let i = 0; i <= ATTRIBUTES.length-1; i++) {
      if (node.hasAttribute(ATTRIBUTES[i])) {
        node.setAttribute(ATTRIBUTES[i], proxyAttribute(node.getAttribute(ATTRIBUTES[i])));
      }
    }
  }

  // Set all elements owning target to target=_blank.
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    // prevent https://www.owasp.org/index.php/Reverse_Tabnabbing
    node.setAttribute('rel', 'noopener noreferrer external');
  } else {
    // set non-HTML/MathML links to xlink:show=new
    if (!node.hasAttribute('target') && (node.hasAttribute('xlink:href') || node.hasAttribute('href'))) {
      node.setAttribute('xlink:show', 'new');
    }
  }
});


function sanitize(dirty, contentType, linkify=true, mark=true, strip=true) {
  if (strip) {
    dirty = dirty.trim();
  }
  if (contentType === 'text') {
    dirty = DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      WHOLE_DOCUMENT: false,
    });
    if (linkify) {
      dirty = linkifyHtml(dirty, LINKIFY_OPTIONS);
    }
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'a',
      'b',
      'em',
      'i',
      'br',
    ],
    FORBID_ATTR: ['style'],
    WHOLE_DOCUMENT: false,
  });
}

export {
  sanitize,
};
