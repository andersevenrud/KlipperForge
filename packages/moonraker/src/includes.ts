export interface ResolvedFile {
  path: string;
  content: string;
  includedBy: string | null;
}

export interface IncludeError {
  includePath: string;
  referencedIn: string;
  message: string;
}

export interface IncludeResolutionResult {
  files: ResolvedFile[];
  errors: IncludeError[];
}

const MAX_DEPTH = 10;
const INCLUDE_PATTERN = /^\[include\s+(.+?)\s*\]$/gm;

export function extractIncludePaths(content: string): string[] {
  const paths: string[] = [];
  for (const match of content.matchAll(INCLUDE_PATTERN)) {
    paths.push(match[1]);
  }
  return paths;
}

export function matchGlobPattern(pattern: string, availableFiles: string[]): string[] {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*")
    .replace(/\?/g, "[^/]");

  const regex = new RegExp(`^${regexStr}$`);
  return availableFiles.filter((f) => regex.test(f));
}

function resolvePath(basePath: string, includePath: string): string {
  if (!basePath.includes("/")) {
    return includePath;
  }
  const dir = basePath.substring(0, basePath.lastIndexOf("/"));
  return `${dir}/${includePath}`;
}

function isGlob(path: string): boolean {
  return path.includes("*") || path.includes("?");
}

export async function resolveIncludes(
  rootPath: string,
  rootContent: string,
  availableFiles: string[],
  fetchFileFn: (path: string) => Promise<string>,
): Promise<IncludeResolutionResult> {
  const files: ResolvedFile[] = [];
  const errors: IncludeError[] = [];
  const visited = new Set<string>();

  async function resolve(filePath: string, content: string, includedBy: string | null, depth: number) {
    if (visited.has(filePath)) {
      errors.push({
        includePath: filePath,
        referencedIn: includedBy ?? filePath,
        message: `Circular include detected: ${filePath}`,
      });
      return;
    }

    if (depth > MAX_DEPTH) {
      errors.push({
        includePath: filePath,
        referencedIn: includedBy ?? filePath,
        message: `Maximum include depth (${MAX_DEPTH}) exceeded`,
      });
      return;
    }

    visited.add(filePath);
    files.push({ path: filePath, content, includedBy });

    const includePaths = extractIncludePaths(content);

    for (const rawInclude of includePaths) {
      const resolvedPattern = resolvePath(filePath, rawInclude);

      if (isGlob(resolvedPattern)) {
        const matched = matchGlobPattern(resolvedPattern, availableFiles);
        if (matched.length === 0) {
          errors.push({
            includePath: rawInclude,
            referencedIn: filePath,
            message: `No files matched pattern: ${rawInclude}`,
          });
          continue;
        }

        for (const matchedPath of matched) {
          if (visited.has(matchedPath)) continue;
          try {
            const matchedContent = await fetchFileFn(matchedPath);
            await resolve(matchedPath, matchedContent, filePath, depth + 1);
          } catch {
            errors.push({
              includePath: matchedPath,
              referencedIn: filePath,
              message: `Failed to fetch: ${matchedPath}`,
            });
          }
        }
      } else {
        if (visited.has(resolvedPattern)) {
          errors.push({
            includePath: rawInclude,
            referencedIn: filePath,
            message: `Circular include detected: ${resolvedPattern}`,
          });
          continue;
        }

        if (!availableFiles.includes(resolvedPattern)) {
          errors.push({
            includePath: rawInclude,
            referencedIn: filePath,
            message: `File not found: ${resolvedPattern}`,
          });
          continue;
        }

        try {
          const includeContent = await fetchFileFn(resolvedPattern);
          await resolve(resolvedPattern, includeContent, filePath, depth + 1);
        } catch {
          errors.push({
            includePath: rawInclude,
            referencedIn: filePath,
            message: `Failed to fetch: ${resolvedPattern}`,
          });
        }
      }
    }
  }

  await resolve(rootPath, rootContent, null, 0);

  return { files, errors };
}
