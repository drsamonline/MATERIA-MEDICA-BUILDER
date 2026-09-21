#!/usr/bin/env python3
"""
HTML Converter Script
Converts downloaded books to structured HTML format
"""

import json
from pathlib import Path
import re
from datetime import datetime

def extract_remedies_from_text(text):
    """Extract remedy names from text using pattern matching"""
    # Common remedy name patterns (capitalized Latin/botanical names)
    remedy_patterns = [
        r'\b[A-Z][a-z]+\s+[a-z]+\b',  # Genus species
        r'\b[A-Z][a-z]+\b',  # Single capitalized words (common remedies)
    ]
    
    remedies = set()
    lines = text.split('\n')
    
    for line in lines:
        # Look for remedy headers (typically all caps or title case at start of line)
        if len(line.strip()) < 100:  # Likely a heading
            # Check for common remedy indicators
            if any(indicator in line.upper() for indicator in ['PROVINGS', 'SYMPTOMS', 'THERAPEUTIC', 'INDICATIONS']):
                continue
            
            # Extract potential remedy name
            clean_line = line.strip().rstrip(':').rstrip('.')
            if clean_line and clean_line[0].isupper():
                # Filter out common non-remedy words
                exclude_words = {'Introduction', 'Preface', 'Contents', 'Chapter', 'Section', 
                               'Appendix', 'Index', 'Conclusion', 'Notes', 'References'}
                if clean_line not in exclude_words and len(clean_line) > 2:
                    remedies.add(clean_line)
    
    return sorted(list(remedies))

def convert_to_html(book_info, text_content, output_dir='books/batch_001'):
    """Convert book text to structured HTML"""
    book_id = book_info.get('id', 'UNKNOWN')
    title = book_info.get('title', 'Untitled')
    author = book_info.get('author', 'Unknown')
    year = book_info.get('year', '?')
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Split text into sections (by remedy)
    lines = text_content.split('\n')
    sections = []
    current_section = {'title': 'Introduction', 'content': []}
    
    for line in lines:
        # Detect new remedy section (capitalized line, relatively short)
        stripped = line.strip()
        if stripped and len(stripped) < 80 and stripped[0].isupper() and ':' not in stripped[:20]:
            # Save previous section
            if current_section['content']:
                sections.append(current_section)
            # Start new section
            current_section = {
                'title': stripped.rstrip(':').rstrip('.'),
                'content': []
            }
        else:
            current_section['content'].append(line)
    
    # Add last section
    if current_section['content']:
        sections.append(current_section)
    
    # Generate HTML
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="book-id" content="{book_id}">
    <meta name="author" content="{author}">
    <meta name="year" content="{year}">
    <meta name="generated-date" content="{datetime.now().isoformat()}">
    <title>{title} - {author}</title>
    <link rel="stylesheet" href="../../website/css/book.css">
</head>
<body>
    <header class="book-header">
        <nav class="breadcrumb">
            <a href="../../website/index.html">Home</a> &gt; 
            <a href="books_index.html">Books</a> &gt; 
            <span>{title}</span>
        </nav>
        <h1 class="book-title">{title}</h1>
        <p class="book-meta">By {author} ({year})</p>
    </header>
    
    <nav class="remedy-navigation">
        <h2>Remedies in this Book</h2>
        <ul class="remedy-list">
'''
    
    # Add remedy navigation
    remedy_count = 0
    for section in sections:
        if section['title'] not in ['Introduction', 'Preface', 'Contents', 'Index']:
            remedy_slug = section['title'].lower().replace(' ', '-').replace('.', '')
            html_content += f'            <li><a href="#remedy-{remedy_slug}">{section["title"]}</a></li>\n'
            remedy_count += 1
    
    html_content += f'''        </ul>
        <p>Total remedies: {remedy_count}</p>
    </nav>
    
    <main class="book-content">
'''
    
    # Add remedy sections
    for section in sections:
        remedy_slug = section['title'].lower().replace(' ', '-').replace('.', '')
        content_text = '\n'.join(section['content'])
        
        # Convert basic formatting
        content_html = content_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        content_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content_html)
        content_html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', content_html)
        content_html = content_html.replace('\n\n', '</p><p>')
        
        html_content += f'''        <section class="remedy" id="remedy-{remedy_slug}">
            <h2>{section["title"]}</h2>
            <div class="remedy-content">
                <p>{content_html}</p>
            </div>
        </section>
        
'''
    
    html_content += f'''    </main>
    
    <footer class="book-footer">
        <p><strong>Book ID:</strong> {book_id}</p>
        <p><strong>Title:</strong> {title}</p>
        <p><strong>Author:</strong> {author}</p>
        <p><strong>Year:</strong> {year}</p>
        <p><strong>Source:</strong> <a href="{book_info.get('source_url', '#')}">Internet Archive</a></p>
        <p><strong>Public Domain:</strong> Yes (Published before 1928)</p>
        <p class="disclaimer">This is a digitized version of a public domain work. The text has been processed automatically and may contain errors.</p>
    </footer>
    
    <script src="../../website/js/book.js"></script>
</body>
</html>
'''
    
    # Save HTML file
    filename = f"{book_id.lower()}.html"
    filepath = output_path / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"  Created HTML: {filename}")
    
    # Return remedy list for indexing
    remedies = [s['title'] for s in sections if s['title'] not in ['Introduction', 'Preface', 'Contents', 'Index']]
    return remedies

def process_batch(batch_num):
    """Process a batch of books"""
    print(f"\n{'='*60}")
    print(f"CONVERTING BATCH {batch_num:03d} TO HTML")
    print(f"{'='*60}")
    
    # Load bibliography
    with open('raw_texts/book_bibliography.json', 'r') as f:
        bibliography = json.load(f)
    
    batch_books = [b for b in bibliography['books'] if b.get('batch') == batch_num]
    print(f"Processing {len(batch_books)} books in batch {batch_num}")
    
    all_remedies = {}
    
    for i, book in enumerate(batch_books, 1):
        print(f"\n[{i}/{len(batch_books)}] {book.get('title', 'Unknown')}")
        
        ia_id = book.get('ia_identifier', '')
        text_file = Path(f'raw_texts/archive_org/{ia_id}.txt')
        
        if not text_file.exists():
            print(f"  No text file found, checking for PDF...")
            # Would need PDF processing here
            continue
        
        # Read text content
        with open(text_file, 'r', encoding='utf-8', errors='ignore') as f:
            text_content = f.read()
        
        # Convert to HTML
        output_dir = f"books/batch_{batch_num:03d}"
        remedies = convert_to_html(book, text_content, output_dir)
        
        all_remedies[book['id']] = {
            'title': book['title'],
            'author': book['author'],
            'remedies': remedies,
            'remedy_count': len(remedies)
        }
        
        print(f"  Extracted {len(remedies)} remedies")
    
    # Save remedies index for this batch
    indices_dir = Path('indices')
    indices_dir.mkdir(exist_ok=True)
    
    with open(indices_dir / f'batch_{batch_num:03d}_remedies.json', 'w') as f:
        json.dump(all_remedies, f, indent=2)
    
    print(f"\nBatch {batch_num} conversion complete!")
    print(f"Total books processed: {len(all_remedies)}")
    total_remedies = sum(b['remedy_count'] for b in all_remedies.values())
    print(f"Total remedies extracted: {total_remedies}")
    
    return all_remedies

if __name__ == '__main__':
    # Process batch 1
    process_batch(1)
