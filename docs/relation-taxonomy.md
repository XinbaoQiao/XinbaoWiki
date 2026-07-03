# Xinbaopedia Relation Taxonomy

Xinbaopedia pages may declare structured relations in frontmatter:

```yaml
relations:
  - type: depends-on
    target: Synthetic_Data
    label: concept foundation
```

Use structured relations only when the connection is stable enough to be useful to graph consumers. Ordinary prose links can remain body WikiLinks.

## Relation Types

### related

Use `related` for a broad topical association that does not imply direction, dependency, citation, or derivation.

Good use: two research topics are frequently read together.

Avoid when: one page is a prerequisite, a source, a replacement, or a citation. Use a more specific relation.

### uses

Use `uses` when the source page applies a method, dataset, tool, concept, or institutional resource described by the target page.

Good use: a paper page uses a research method page.

Avoid when: the source merely mentions the target or needs it as background. Use `related` or `depends-on`.

### depends-on

Use `depends-on` when understanding or defining the source page requires the target page as conceptual infrastructure.

Good use: a topic page depends on a core concept page.

Avoid when: the source only applies the target in an implementation. Use `uses`.

### supersedes

Use `supersedes` when the source replaces, updates, or makes an older target page less current.

Good use: a newer project overview supersedes a legacy resource inventory.

Avoid when: both pages remain parallel viewpoints. Use `related`.

### contradicts

Use `contradicts` when the source explicitly disputes, falsifies, or provides counterevidence against the target.

Good use: a results page documents evidence that conflicts with a prior claim page.

Avoid when: the pages merely discuss tradeoffs or different assumptions. Use prose or `related`.

### derived-from

Use `derived-from` when the source was produced by transforming, summarizing, translating, or adapting the target.

Good use: a cleaned resource page is derived from an older resource inventory.

Avoid when: the source only cites the target as evidence. Use `cites`.

### cites

Use `cites` when the source page relies on the target as an explicit bibliographic or evidence source.

Good use: a topic page cites a paper page as a primary supporting work.

Avoid when: the source is based on the target's content rather than referencing it. Use `derived-from`.

## Translation Pairs

Chinese pages should use `translation_of` to identify the English counterpart:

```yaml
language: zh
translation_of: Synthetic_Data
```

The maintenance report checks that each visible English page has a Chinese counterpart and that each visible Chinese page points back to an existing English page.
