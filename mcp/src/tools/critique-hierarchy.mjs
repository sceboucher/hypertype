import { critiqueHierarchy } from '../hierarchy.mjs';

// Pull <style> blocks and style="" attributes out of an HTML document so the same
// analyzer works on a whole artifact, not just a CSS snippet.
function cssFromHtml(html) {
  let css = '';
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  for (const block of styleBlocks) css += block.replace(/<\/?style[^>]*>/gi, '') + '\n';
  const inline = html.match(/style\s*=\s*"([^"]*)"/gi) || [];
  let i = 0;
  for (const attr of inline) {
    const decls = attr.replace(/^style\s*=\s*"/i, '').replace(/"$/, '');
    css += `.inline-${i++} { ${decls} }\n`;
  }
  return css;
}

export default {
  name: 'critique_hierarchy',
  description:
    'Analyze the typographic hierarchy of CSS or an HTML document and flag the known ' +
    'AI tells: flat hierarchy, bold-only hierarchy, sub-1.2x size steps, symmetric heading ' +
    'margins (headings should bind downward), too many distinct text styles, one global ' +
    'line-height across display and body, and runaway measure. Each finding includes a fix. ' +
    'Use this to check whether the pieces of type on screen actually relate to each other.',
  inputSchema: {
    type: 'object',
    properties: {
      css: { type: 'string', description: 'CSS text to analyze.' },
      html: { type: 'string', description: 'A full HTML document; <style> blocks and inline styles are extracted.' },
    },
  },
  async handler({ css, html }) {
    if (!css && !html) throw new Error('Provide either css or html.');
    const source = css ? css : cssFromHtml(html);
    return critiqueHierarchy(source);
  },
};
