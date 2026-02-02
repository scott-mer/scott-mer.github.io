#!/usr/bin/env python3
"""
Build script for scottmer.github.io
Generates a directory section with all pages organized by date created.
"""

import os
import re
from datetime import datetime
from pathlib import Path

# Configuration
SITE_ROOT = Path(__file__).parent
INDEX_FILE = SITE_ROOT / "index.html"
POSTS_DIR = SITE_ROOT / "posts"

# Directory section markers
DIR_START = "<!-- DIRECTORY_START -->"
DIR_END = "<!-- DIRECTORY_END -->"


def get_html_files(directory: Path) -> list[Path]:
    """Recursively find all HTML files in a directory."""
    html_files = []
    if directory.exists():
        for path in directory.rglob("*.html"):
            html_files.append(path)
    return html_files


def get_git_first_commit_date(file_path: Path) -> datetime:
    """Get the date when a file was first committed to git."""
    import subprocess
    try:
        # Get relative path from repo root
        rel_path = file_path.relative_to(SITE_ROOT).as_posix()
        
        # Get the first commit date for this file
        result = subprocess.run(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%aI", "--", rel_path],
            cwd=SITE_ROOT,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout.strip():
            # Get the last line (first commit date)
            lines = result.stdout.strip().split('\n')
            first_date = lines[-1] if lines else None
            if first_date:
                # Parse ISO format date
                return datetime.fromisoformat(first_date.replace('Z', '+00:00'))
    except Exception as e:
        print(f"  Warning: Could not get git date for {file_path}: {e}")
    
    # Fallback to file modification time
    return get_file_modified_date(file_path)


def get_file_modified_date(file_path: Path) -> datetime:
    """Get the modification date of a file as fallback."""
    stat = file_path.stat()
    return datetime.fromtimestamp(stat.st_mtime)


def extract_title(file_path: Path) -> str:
    """Extract the title from an HTML file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        # Try to find <title> tag
        title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        if title_match:
            return title_match.group(1).strip()
        # Try to find <h1> tag
        h1_match = re.search(r"<h1[^>]*>(.*?)</h1>", content, re.IGNORECASE | re.DOTALL)
        if h1_match:
            # Strip any HTML tags from the h1 content
            h1_text = re.sub(r"<[^>]+>", "", h1_match.group(1))
            return h1_text.strip()
    except Exception:
        pass
    # Fallback to filename
    return file_path.stem.replace("-", " ").replace("_", " ").title()


def extract_description(file_path: Path) -> str:
    """Extract the meta description from an HTML file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        # Try to find <meta name="description"> tag
        # Use separate patterns for double-quoted and single-quoted content
        # to avoid issues with quotes inside the description
        desc_match = re.search(
            r'<meta\s+name=["\']description["\']\s+content="([^"]*)"',
            content, re.IGNORECASE | re.DOTALL
        )
        if not desc_match:
            desc_match = re.search(
                r"<meta\s+name=[\"']description[\"']\s+content='([^']*)'",
                content, re.IGNORECASE | re.DOTALL
            )
        if desc_match:
            return desc_match.group(1).strip()
    except Exception:
        pass
    return ""


def extract_date(file_path: Path) -> datetime | None:
    """Extract the date from a meta tag in an HTML file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        # Try to find <meta name="date"> tag
        date_match = re.search(
            r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']',
            content, re.IGNORECASE
        )
        if date_match:
            date_str = date_match.group(1).strip()
            # Parse YYYY-MM-DD format
            return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        pass
    return None


def extract_hidden(file_path: Path) -> bool:
    """Extract the hidden status from a meta tag in an HTML file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        # Try to find <meta name="hidden"> tag
        hidden_match = re.search(
            r'<meta\s+name=["\']hidden["\']\s+content=["\'](.*?)["\']',
            content, re.IGNORECASE
        )
        if hidden_match:
            return hidden_match.group(1).strip().lower() == "true"
    except Exception:
        pass
    return False


def get_relative_url(file_path: Path) -> str:
    """Get the URL path relative to the site root."""
    return file_path.relative_to(SITE_ROOT).as_posix()


def generate_directory_html(pages: list[dict]) -> str:
    """Generate the HTML for the directory section."""
    if not pages:
        return f"""{DIR_START}
    <section class="directory" id="directory">
        <p class="no-pages">No pages yet!</p>
    </section>
    {DIR_END}"""

    items_html = ""
    for page in pages:
        date_str = page["date"].strftime("%b %d, %Y")
        desc_html = ""
        if page.get("description"):
            desc_html = f'\n                <span class="description">{page["description"]}</span>'
        items_html += f"""
            <li class="directory-item">
                <div class="directory-info">
                    <a href="{page['url']}">{page['title']}</a>{desc_html}
                </div>
                <span class="date">{date_str}</span>
            </li>"""

    return f"""{DIR_START}
    <section class="directory" id="directory">
        <ul class="directory-list">{items_html}
        </ul>
    </section>
    {DIR_END}"""


def update_index_html(directory_html: str) -> None:
    """Update the index.html file with the new directory section."""
    if not INDEX_FILE.exists():
        print(f"Error: {INDEX_FILE} not found!")
        return

    content = INDEX_FILE.read_text(encoding="utf-8")

    # Check if directory markers exist
    if DIR_START in content and DIR_END in content:
        # Replace existing directory section
        pattern = re.escape(DIR_START) + r".*?" + re.escape(DIR_END)
        new_content = re.sub(pattern, directory_html, content, flags=re.DOTALL)
    else:
        # Insert directory section before </body>
        new_content = content.replace("</body>", f"\n    {directory_html}\n</body>")

    INDEX_FILE.write_text(new_content, encoding="utf-8")
    print(f"Updated {INDEX_FILE}")


def main():
    print("Building directory section...")

    # Collect all HTML pages
    html_files = get_html_files(POSTS_DIR)

    # Build page info list (skip hidden pages)
    pages = []
    hidden_count = 0
    for file_path in html_files:
        # Skip hidden pages
        if extract_hidden(file_path):
            hidden_count += 1
            continue
            
        # Try to get date from meta tag first, fallback to git date
        meta_date = extract_date(file_path)
        date = meta_date if meta_date else get_git_first_commit_date(file_path)
        
        pages.append({
            "path": file_path,
            "url": get_relative_url(file_path),
            "title": extract_title(file_path),
            "date": date,
            "description": extract_description(file_path),
        })
    
    if hidden_count > 0:
        print(f"Skipped {hidden_count} hidden page(s)")

    # Sort by date (newest first)
    pages.sort(key=lambda x: x["date"], reverse=True)

    print(f"Found {len(pages)} page(s):")
    for page in pages:
        print(f"  - {page['title']} ({page['date'].strftime('%Y-%m-%d')})")

    # Generate and update HTML
    directory_html = generate_directory_html(pages)
    update_index_html(directory_html)

    print("Build complete!")


if __name__ == "__main__":
    main()
