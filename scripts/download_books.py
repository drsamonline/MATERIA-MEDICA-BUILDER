#!/usr/bin/env python3
"""
Book Downloader Script
Downloads books from Internet Archive based on bibliography
"""

import requests
import json
from pathlib import Path
import time
from datetime import datetime

def download_book(book_info, output_dir='raw_texts/archive_org'):
    """Download a book from Internet Archive"""
    ia_identifier = book_info.get('ia_identifier', '')
    if not ia_identifier:
        print(f"  Skipping {book_info.get('title', 'Unknown')}: No IA identifier")
        return False
    
    output_path = Path(output_dir) / f"{ia_identifier}_metadata.json"
    
    # Check if already downloaded
    if output_path.exists():
        print(f"  Already downloaded: {book_info.get('title', 'Unknown')}")
        return True
    
    # Download metadata and text URLs
    base_url = f"https://archive.org/download/{ia_identifier}"
    
    try:
        # Get book metadata
        metadata_url = f"https://archive.org/metadata/{ia_identifier}"
        response = requests.get(metadata_url, timeout=30)
        
        if response.status_code == 200:
            metadata = response.json()
            
            # Save metadata
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'book_id': book_info.get('id'),
                    'title': book_info.get('title'),
                    'author': book_info.get('author'),
                    'year': book_info.get('year'),
                    'downloaded_at': datetime.now().isoformat(),
                    'ia_metadata': metadata
                }, f, indent=2)
            
            print(f"  Downloaded metadata for: {book_info.get('title', 'Unknown')}")
            
            # Try to get plain text version if available
            text_url = f"{base_url}/{ia_identifier}.txt"
            text_response = requests.get(text_url, timeout=30)
            
            if text_response.status_code == 200:
                text_path = Path(output_dir) / f"{ia_identifier}.txt"
                with open(text_path, 'wb') as f:
                    f.write(text_response.content)
                print(f"  Downloaded text file for: {book_info.get('title')}")
                return True
            
            # Otherwise note that we need PDF processing
            pdf_url = f"{base_url}/{ia_identifier}.pdf"
            pdf_path = Path(output_dir) / f"{ia_identifier}.pdf"
            
            if not pdf_path.exists():
                pdf_response = requests.get(pdf_url, timeout=60, stream=True)
                if pdf_response.status_code == 200:
                    with open(pdf_path, 'wb') as f:
                        for chunk in pdf_response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    print(f"  Downloaded PDF for: {book_info.get('title')}")
            
            return True
        else:
            print(f"  Failed to download {book_info.get('title')}: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  Error downloading {book_info.get('title')}: {e}")
        return False

def download_batch(books, batch_num):
    """Download a batch of books"""
    print(f"\n{'='*60}")
    print(f"DOWNLOADING BATCH {batch_num:03d}")
    print(f"{'='*60}")
    
    success_count = 0
    fail_count = 0
    
    for i, book in enumerate(books, 1):
        print(f"\n[{i}/{len(books)}] {book.get('title', 'Unknown')} ({book.get('year', '?')})")
        
        if download_book(book):
            success_count += 1
        else:
            fail_count += 1
        
        # Rate limiting - be nice to archive.org
        time.sleep(2)
    
    print(f"\nBatch {batch_num} complete: {success_count} succeeded, {fail_count} failed")
    return success_count, fail_count

if __name__ == '__main__':
    # Load bibliography
    with open('raw_texts/book_bibliography.json', 'r') as f:
        bibliography = json.load(f)
    
    books = bibliography['books']
    print(f"Loaded bibliography with {len(books)} books")
    
    # Process batch 1
    batch_1_books = [b for b in books if b.get('batch') == 1]
    print(f"Batch 1 contains {len(batch_1_books)} books")
    
    download_batch(batch_1_books, 1)
