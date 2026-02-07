import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentRoot = path.resolve("content");
const directionsRoot = path.join(contentRoot, "directions");

export async function getGlobals() {
  const raw = await fs.readFile(path.join(contentRoot, "globals.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getDirections() {
  const files = await fs.readdir(directionsRoot);
  const directions = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(directionsRoot, file), "utf-8");
        const parsed = matter(raw);
        return {
          ...parsed.data,
          slug: parsed.data.slug ?? file.replace(/\.md$/, ""),
        };
      })
  );

  return directions.sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getDirectionBySlug(slug) {
  const files = await fs.readdir(directionsRoot);
  const match = files.find((file) => file.replace(/\.md$/, "") === slug);
  if (!match) {
    return null;
  }
  const raw = await fs.readFile(path.join(directionsRoot, match), "utf-8");
  const parsed = matter(raw);
  return {
    ...parsed.data,
    slug: parsed.data.slug ?? slug,
  };
}
