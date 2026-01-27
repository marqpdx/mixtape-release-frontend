import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import { remarkHeadings, type ContentHeading } from "./remark-headings";

export type MarkdownFrontmatter = {
  title?: string;
  summary?: string;
  author?: string;
  date?: string;
  tags?: string[];
  [key: string]: unknown;
};

export type MarkdownRenderResult = {
  html: string;
  headings: ContentHeading[];
};

export type MarkdownFileResult = MarkdownRenderResult & {
  frontmatter: MarkdownFrontmatter;
  content: string;
};

const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
};

const normalizeFrontmatter = (data: Record<string, unknown>): MarkdownFrontmatter => {
  const frontmatter: MarkdownFrontmatter = { ...data };
  if (frontmatter.tags) {
    frontmatter.tags = normalizeTags(frontmatter.tags);
  }
  return frontmatter;
};

export async function renderMarkdown(content: string): Promise<MarkdownRenderResult> {
  const headings: ContentHeading[] = [];
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHeadings(headings))
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(content);
  return { html: processed.toString(), headings };
}

export async function loadMarkdownFile(filePath: string): Promise<MarkdownFileResult> {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const rendered = await renderMarkdown(content);
  return {
    ...rendered,
    frontmatter: normalizeFrontmatter(data as Record<string, unknown>),
    content,
  };
}

export async function loadMarkdownFromRoot(
  rootDir: string,
  relativePath: string
): Promise<MarkdownFileResult> {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Markdown file not found at ${filePath}`);
  }
  return loadMarkdownFile(filePath);
}
