import type { Plugin } from "unified";
import type { Root, Content, Heading as MdastHeading } from "mdast";
import GithubSlugger from "github-slugger";

export type ContentHeading = {
  id: string;
  text: string;
  level: number;
};

const getTextFromNode = (node: Root | Content | undefined): string => {
  if (!node) {
    return "";
  }
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => getTextFromNode(child)).join("");
  }
  return "";
};

export const remarkHeadings = (headings: ContentHeading[]): Plugin<[], Root> => {
  return () => (tree) => {
    const slugger = new GithubSlugger();

    const visit = (node: Root | Content | undefined) => {
      if (!node) {
        return;
      }
      if (node.type === "heading") {
        const headingNode = node as MdastHeading;
        const level = headingNode.depth;
        if (level >= 2 && level <= 3) {
          const text = getTextFromNode(headingNode).trim();
          if (text) {
            const id = slugger.slug(text);
            headingNode.data = headingNode.data ?? {};
            headingNode.data.hProperties = headingNode.data.hProperties ?? {};
            headingNode.data.hProperties.id = id;
            headings.push({ id, text, level });
          }
        }
      }
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach((child) => visit(child));
      }
    };

    visit(tree);
  };
};
