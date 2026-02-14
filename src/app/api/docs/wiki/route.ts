import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    // Read the wiki markdown file from the docs folder
    const wikiPath = join(process.cwd(), "docs", "WIKI.md")
    const content = await readFile(wikiPath, "utf-8")

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Prevent caching for development, enable in production
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Error reading wiki file:", error)
    return new NextResponse("# Wiki not found\n\nThe documentation file could not be loaded.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }
}
