#!/usr/bin/env python3
"""
Book Discovery Script for Homeopathic Materia Medica Library
Searches Internet Archive API for open-domain homeopathic books
"""

import requests
import json
from datetime import datetime
from pathlib import Path

# Internet Archive Advanced Search API
IA_API_BASE = "https://archive.org/advancedsearch.php"

# Search queries for homeopathic materia medica
SEARCH_QUERIES = [
    # Core materia medica searches
    'collection:publusa AND (homeopathy OR homoeopathy) AND materia medica',
    'collection:publusa AND (homeopathy OR homoeopathy) AND repertory',
    'collection:publusa AND homeopathy AND (kent OR boericke OR hahnemann)',
    'collection:publusa AND homeopathic AND (materia OR pharmacopoeia)',
    
    # Specific author searches
    'creator:"Kent, James Tyler" AND homeopathy',
    'creator:"Boericke, William" AND homeopathy',
    'creator:"Hahnemann, Samuel" AND homeopathy',
    'creator:"Allen, Henry Clay" AND homeopathy',
    'creator:"Clarke, John Henry" AND homeopathy',
    'creator:"Nash, Eugene Beauharnais" AND homeopathy',
    'creator:"Farrington, Edwin" AND homeopathy',
    'creator:"Hering, Constantine" AND homeopathy',
    'creator:"Guernsey, Egbert" AND homeopathy',
    'creator:"Boger, Clarence Siebart" AND homeopathy',
    
    # Subject searches
    'subject:"Homeopathy" AND mediatype:texts',
    'subject:"Materia Medica, Homeopathic" AND mediatype:texts',
    'subject:"Homoeopathic materia medica" AND mediatype:texts',
    
    # Additional collections
    'collection:medicalheritagelibrary AND homeopathy',
    'collection:nihlibrary AND homeopathy',
]

def search_internet_archive(query, rows=50, page=1):
    """Search Internet Archive and return results"""
    params = {
        'q': query,
        'fl[]': ['identifier', 'title', 'creator', 'date', 'publisher', 
                 'subject', 'mediatype', 'format'],
        'rows': rows,
        'page': page,
        'sort[]': ['date desc'],
        'output': 'json'
    }
    
    try:
        response = requests.get(IA_API_BASE, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get('response', {})
    except Exception as e:
        print(f"Error searching IA: {e}")
        return {}

def filter_public_domain(results):
    """Filter results to ensure public domain status"""
    filtered = []
    current_year = datetime.now().year
    
    for doc in results.get('docs', []):
        # Check date - pre-1928 is safe for US public domain
        pub_date = doc.get('date', '')
        if pub_date:
            try:
                # Extract year from various date formats
                year_str = ''.join(filter(str.isdigit, str(pub_date)[:4]))
                if year_str:
                    year = int(year_str)
                    if year < 1928:
                        # Check format availability
                        formats = doc.get('format', [])
                        if isinstance(formats, str):
                            formats = [formats]
                        
                        # Prefer text formats
                        preferred_formats = ['Text PDF', 'Plain Text', 'DjVu', 
                                           'Full Text', 'EPUB']
                        has_good_format = any(f in formats for f in preferred_formats)
                        
                        if has_good_format or 'Text' in str(formats):
                            doc['public_domain_verified'] = True
                            doc['publication_year'] = year
                            filtered.append(doc)
            except:
                pass
    
    return filtered

def deduplicate_books(all_books):
    """Remove duplicate books based on identifier"""
    seen = set()
    unique = []
    
    for book in all_books:
        identifier = book.get('identifier', '')
        if identifier and identifier not in seen:
            seen.add(identifier)
            unique.append(book)
    
    return unique

def discover_books(output_file='raw_texts/book_bibliography.json', max_results=120):
    """Main discovery function"""
    print("Starting book discovery from Internet Archive...")
    all_results = []
    
    for i, query in enumerate(SEARCH_QUERIES[:8], 1):  # Limit to first 8 queries for speed
        print(f"\nQuery {i}/8: {query[:60]}...")
        
        # Get only first 2 pages for speed
        for page in range(1, 3):
            results = search_internet_archive(query, rows=50, page=page)
            if not results.get('docs'):
                break
            
            filtered = filter_public_domain(results)
            all_results.extend(filtered)
            
            # Stop if we've gotten enough from this query
            if len(filtered) < 5:
                break
        
        current_unique = len(deduplicate_books(all_results))
        print(f"  Found {current_unique} unique verified PD books so far")
        
        # Early exit if we have enough
        if current_unique >= max_results:
            print(f"  Reached target of {max_results} books, stopping discovery")
            break
    
    # Deduplicate
    unique_books = deduplicate_books(all_results)[:max_results]  # Limit to max_results
    print(f"\nTotal unique public domain books found: {len(unique_books)}")
    
    # Sort by year (oldest first for historical value)
    unique_books.sort(key=lambda x: x.get('publication_year', 9999))
    
    # Save to file
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'discovery_date': datetime.now().isoformat(),
            'total_books': len(unique_books),
            'books': unique_books
        }, f, indent=2, ensure_ascii=False)
    
    print(f"Bibliography saved to: {output_path}")
    
    return unique_books

if __name__ == '__main__':
    books = discover_books()
    print(f"\nDiscovery complete! Found {len(books)} public domain homeopathic books.")
