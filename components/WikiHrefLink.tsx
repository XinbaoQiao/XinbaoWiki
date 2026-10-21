import type { ComponentProps, ReactNode } from 'react';
import { WikiLink } from '@/components/WikiLink';
import { classifyWikiHref, wikiLinkClassName } from '@/lib/wiki-href';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
  /** When false, skip pathWithBasePath (href already finalized). */
  applyBasePath?: boolean;
  target?: ComponentProps<'a'>['target'];
  rel?: ComponentProps<'a'>['rel'];
};

/**
 * Renders in-page (#) anchors vs cross-page WikiLink (Jim title morph) vs external.
 * Cross-page body links use titleMorphOrigin=body so prepare always arms the clicked chip.
 */
export function WikiHrefLink({
  href,
  children,
  className,
  title,
  applyBasePath,
  target,
  rel,
  ...rest
}: Props & { 'aria-label'?: string }) {
  const classified = classifyWikiHref(href, { applyBasePath });
  const mergedClass = wikiLinkClassName(classified.kind, className, classified.href);

  if (classified.kind === 'local') {
    return (
      <a className={mergedClass} href={classified.href} title={title} {...rest}>
        {children}
      </a>
    );
  }

  if (classified.kind === 'external' || classified.kind === 'asset') {
    const isHttp = /^https?:/i.test(classified.href);
    return (
      <a
        className={mergedClass}
        href={classified.href}
        title={title}
        target={target ?? (isHttp ? '_blank' : undefined)}
        rel={rel ?? (isHttp ? 'noreferrer' : undefined)}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <WikiLink
      className={mergedClass}
      href={classified.href}
      title={title}
      titleMorphOrigin="body"
      titleMorphSlug={classified.morphSlug}
      {...rest}
    >
      {children}
    </WikiLink>
  );
}