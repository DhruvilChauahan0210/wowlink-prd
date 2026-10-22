import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * Turns a tree of plain SVG elements (and simple, hook-free function components) into an SVG string,
 * for images rendered on the server, like share previews. It's deliberately small: no hooks, no context.
 */

// SVG attributes that really are camelCase. Every other camelCase React prop becomes kebab-case.
const CAMEL = new Set([
  "viewBox", "preserveAspectRatio", "baseFrequency", "numOctaves", "stdDeviation", "xChannelSelector", "yChannelSelector",
  "gradientUnits", "gradientTransform", "patternUnits", "patternTransform", "filterUnits", "primitiveUnits", "pathLength",
  "attributeName", "repeatCount", "calcMode", "keyTimes", "keySplines", "tableValues", "maskUnits", "clipPathUnits",
  "markerWidth", "markerHeight", "refX", "refY", "textLength", "lengthAdjust", "startOffset", "spreadMethod",
]);

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const attrName = (name: string) => (name === "className" ? "class" : CAMEL.has(name) ? name : kebab(name));
const escape = (value: unknown) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderSvg(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return escape(node);
  if (Array.isArray(node)) return node.map(renderSvg).join("");
  if (!isValidElement(node)) return "";
  const { type, props } = node as ReactElement<Record<string, unknown>>;
  if (type === Fragment) return renderSvg(props.children as ReactNode);
  if (typeof type === "function") return renderSvg((type as (p: Record<string, unknown>) => ReactNode)(props));
  if (typeof type !== "string") return "";
  let attrs = "";
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" || value == null || value === false || typeof value === "function") continue;
    if (key === "style") {
      // Custom properties (like --d, used for drawing animations) mean nothing outside the page.
      const css = Object.entries(value as Record<string, unknown>).filter(([p]) => !p.startsWith("--")).map(([p, v]) => `${kebab(p)}:${v}`).join(";");
      if (css) attrs += ` style="${escape(css)}"`;
      continue;
    }
    attrs += ` ${attrName(key)}="${escape(value === true ? "true" : value)}"`;
  }
  return `<${type}${attrs}>${renderSvg(props.children as ReactNode)}</${type}>`;
}
