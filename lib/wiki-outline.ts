import type { Element, Root, RootContent } from 'hast';

function textContent(node: RootContent): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textContent).join('');
  return '';
}

/** Build links from the same rendered heading tree, including Markdown formatting and footnotes. */
export function rehypeWikiOutline({ label }: { label: string }) {
  return (tree: Root) => {
    const headings: Element[] = [];
    const used = new Set<string>();
    const collect = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type !== 'element') continue;
        if (node.properties.id) used.add(String(node.properties.id));
        if (node.tagName === 'h2' || node.tagName === 'h3') headings.push(node);
        collect(node.children);
      }
    };
    collect(tree.children);
    for (const heading of headings) {
      if (heading.properties.id) continue;
      const slug = textContent(heading).trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'heading';
      const base = `section-${slug}`;
      let id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      heading.properties.id = id;
      heading.properties.tabIndex = -1;
    }
    const sections = headings.filter((heading) => heading.tagName === 'h2');
    if (sections.length < 2) return;
    // Keep the introduction first; section links belong at the transition into the article.
    const firstSection = tree.children.findIndex((node) => node === sections[0]);
    tree.children.splice(Math.max(0, firstSection), 0, {
      type: 'element', tagName: 'nav', properties: { className: ['wiki-article-contents'], ariaLabel: label },
      children: [
        { type: 'element', tagName: 'span', properties: { className: ['wiki-contents-label'] }, children: [{ type: 'text', value: label }] },
        {
            type: 'element', tagName: 'ol', properties: {},
            children: sections.map((heading) => ({
              type: 'element', tagName: 'li', properties: {},
              children: [{
                type: 'element', tagName: 'a', properties: { href: `#${encodeURIComponent(String(heading.properties.id))}` },
                children: [{ type: 'text', value: textContent(heading) }]
              }]
            }))
        }
      ]
    });
  };
}
