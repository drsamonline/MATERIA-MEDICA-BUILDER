#!/usr/bin/env python3
"""
Verification Script
Verifies converted HTML against original text
"""

import json
from pathlib import Path
from datetime import datetime
import difflib

def verify_book_html(book_info, batch_num):
    """Verify HTML conversion for a single book"""
    book_id = book_info['id']
    title = book_info['title']
    ia_id = book_info.get('ia_identifier', '')
    
    # Check files exist
    text_file = Path(f'raw_texts/archive_org/{ia_id}.txt')
    html_file = Path(f'books/batch_{batch_num:03d}/{book_id.lower()}.html')
    
    verification_result = {
        'book_id': book_id,
        'title': title,
        'timestamp': datetime.now().isoformat(),
        'checks': {},
        'passed': True,
        'warnings': [],
        'errors': []
    }
    
    # Check 1: Files exist
    if not text_file.exists():
        verification_result['checks']['files_exist'] = False
        verification_result['errors'].append(f"Original text file not found: {text_file}")
        verification_result['passed'] = False
        return verification_result
    
    if not html_file.exists():
        verification_result['checks']['files_exist'] = False
        verification_result['errors'].append(f"HTML file not found: {html_file}")
        verification_result['passed'] = False
        return verification_result
    
    verification_result['checks']['files_exist'] = True
    
    # Check 2: Read files
    with open(text_file, 'r', encoding='utf-8', errors='ignore') as f:
        original_text = f.read()
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Check 3: Content preservation (sample check)
    # Extract first 500 chars of meaningful content from original
    original_lines = [l.strip() for l in original_text.split('\n') if len(l.strip()) > 20]
    sample_original = ' '.join(original_lines[:10])
    
    # Check if sample appears in HTML (with some tolerance for formatting changes)
    words_match = sum(1 for word in sample_original.split()[:20] if word in html_content)
    match_percentage = (words_match / 20) * 100
    
    verification_result['checks']['content_preservation'] = match_percentage >= 70
    if match_percentage < 70:
        verification_result['warnings'].append(f"Content preservation low: {match_percentage:.1f}%")
    if match_percentage < 50:
        verification_result['errors'].append(f"Content preservation very low: {match_percentage:.1f}%")
        verification_result['passed'] = False
    
    # Check 4: HTML structure
    required_elements = ['<!DOCTYPE html>', '<html', '<head>', '<body>', '</html>']
    missing_elements = [el for el in required_elements if el not in html_content]
    
    verification_result['checks']['html_structure'] = len(missing_elements) == 0
    if missing_elements:
        verification_result['errors'].append(f"Missing HTML elements: {missing_elements}")
        verification_result['passed'] = False
    
    # Check 5: Metadata present
    metadata_checks = [
        f'meta name="book-id" content="{book_id}"',
        f'meta name="author" content="{book_info.get("author", "")}"',
        f'<title>{title}'
    ]
    missing_metadata = [m for m in metadata_checks if m not in html_content]
    
    verification_result['checks']['metadata_present'] = len(missing_metadata) == 0
    if missing_metadata:
        verification_result['warnings'].append(f"Missing metadata: {missing_metadata}")
    
    # Check 6: Remedy sections
    remedy_sections = html_content.count('<section class="remedy"')
    verification_result['checks']['remedy_sections'] = remedy_sections > 0
    verification_result['remedy_count'] = remedy_sections
    
    if remedy_sections == 0:
        verification_result['warnings'].append("No remedy sections found in HTML")
    
    # Check 7: File size reasonable
    html_size = len(html_content)
    original_size = len(original_text)
    
    # HTML should be larger due to markup, but not excessively so
    size_ratio = html_size / original_size if original_size > 0 else 0
    verification_result['checks']['file_size_reasonable'] = 0.5 < size_ratio < 10
    
    if size_ratio < 0.5:
        verification_result['warnings'].append(f"HTML file suspiciously small (ratio: {size_ratio:.2f})")
    if size_ratio > 10:
        verification_result['warnings'].append(f"HTML file suspiciously large (ratio: {size_ratio:.2f})")
    
    # Summary
    verification_result['original_size'] = original_size
    verification_result['html_size'] = html_size
    verification_result['content_match_percentage'] = match_percentage
    
    return verification_result

def verify_batch(batch_num):
    """Verify all books in a batch"""
    print(f"\n{'='*60}")
    print(f"VERIFICATION REPORT - BATCH {batch_num:03d}")
    print(f"{'='*60}\n")
    
    # Load bibliography
    with open('raw_texts/book_bibliography.json', 'r') as f:
        bibliography = json.load(f)
    
    batch_books = [b for b in bibliography['books'] if b.get('batch') == batch_num]
    
    results = []
    passed_count = 0
    failed_count = 0
    
    for book in batch_books:
        result = verify_book_html(book, batch_num)
        results.append(result)
        
        status = "✓ PASS" if result['passed'] else "✗ FAIL"
        print(f"{status} | {book['id']} | {book['title'][:50]}")
        
        if result['passed']:
            passed_count += 1
        else:
            failed_count += 1
        
        if result['warnings']:
            for warning in result['warnings']:
                print(f"       ⚠ {warning}")
        
        if result['errors']:
            for error in result['errors']:
                print(f"       ✖ {error}")
    
    # Save verification report
    report_dir = Path('verification_logs')
    report_dir.mkdir(exist_ok=True)
    
    report = {
        'batch_number': batch_num,
        'verification_date': datetime.now().isoformat(),
        'total_books': len(results),
        'passed': passed_count,
        'failed': failed_count,
        'pass_rate': (passed_count / len(results) * 100) if results else 0,
        'results': results
    }
    
    with open(report_dir / f'batch_{batch_num:03d}_verification.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"BATCH {batch_num:03d} SUMMARY")
    print(f"{'='*60}")
    print(f"Total books: {len(results)}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")
    print(f"Pass rate: {report['pass_rate']:.1f}%")
    print(f"Report saved to: verification_logs/batch_{batch_num:03d}_verification.json")
    
    return report

if __name__ == '__main__':
    verify_batch(1)
