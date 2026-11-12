const colorProps = /^(?:color|bg|bgColor|background|backgroundColor|backgroundImage|bgGradient|gradientFrom|gradientVia|gradientTo|border(?:Top|Right|Bottom|Left|Start|End)?(?:Color)?|outline(?:Color)?|fill|stroke|textDecorationColor|caretColor|accentColor|boxShadow|textShadow)$/;
const rawColor = /#[\da-f]{3,8}\b|\b(?:gray|red|pink|purple|deepPurple|indigo|blue|lightBlue|cyan|teal|green|lightGreen|lime|yellow|amber|orange|deepOrange|brown|blueGray|blackAlpha|whiteAlpha)\.\d{2,3}\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/i;
const namedColor = /^(?:black|white|red|green|blue|yellow|orange|purple|pink|gray|grey|teal|cyan|magenta|lime|navy|maroon|olive|silver|aqua|fuchsia|brown|indigo|violet|gold|coral|tomato|salmon|rebeccapurple)$/i;

const noRawColors = {
  meta: {
    type: "suggestion",
    docs: { description: "Prefer semantic theme tokens over raw colors in JSX styles" },
    schema: [],
    messages: { rawColor: "Use a semantic theme token instead of raw color '{{value}}'." },
  },
  create(context) {
    function inspect(node, isColor = false) {
      if (!node) return;
      if (node.type === "Literal" && isColor && typeof node.value === "string") {
        if (rawColor.test(node.value) || namedColor.test(node.value.trim())) {
          context.report({ node, messageId: "rawColor", data: { value: node.value } });
        }
      } else if (node.type === "TemplateLiteral" && isColor) {
        for (const part of node.quasis) {
          if (rawColor.test(part.value.raw)) {
            context.report({ node: part, messageId: "rawColor", data: { value: part.value.raw } });
          }
        }
        node.expressions.forEach((part) => inspect(part, isColor));
      } else if (node.type === "ObjectExpression") {
        for (const property of node.properties) {
          if (property.type !== "Property") continue;
          const key = property.key.name ?? property.key.value;
          inspect(property.value, isColor || colorProps.test(key));
        }
      } else if (node.type === "ArrayExpression") {
        node.elements.forEach((part) => inspect(part, isColor));
      } else if (node.type === "ConditionalExpression") {
        inspect(node.consequent, isColor);
        inspect(node.alternate, isColor);
      } else if (node.type === "LogicalExpression") {
        inspect(node.left, isColor);
        inspect(node.right, isColor);
      } else if (node.type === "CallExpression") {
        node.arguments.forEach((part) => inspect(part, isColor));
      } else if (["TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression"].includes(node.type)) {
        inspect(node.expression, isColor);
      }
    }
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const value = node.value?.type === "JSXExpressionContainer" ? node.value.expression : node.value;
        inspect(value, colorProps.test(node.name.name));
      },
    };
  },
};

export default noRawColors;
