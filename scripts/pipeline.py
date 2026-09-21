#!/usr/bin/env python3
"""
Master Pipeline Script
Orchestrates the complete book processing workflow
"""

import subprocess
import json
from pathlib import Path
from datetime import datetime
import sys

def run_script(script_name, description):
    """Run a processing script"""
    print(f"\n{'='*70}")
    print(f"STEP: {description}")
    print(f"{'='*70}\n")
    
    result = subprocess.run([sys.executable, f'scripts/{script_name}'], 
                          capture_output=False, text=True)
    
    if result.returncode != 0:
        print(f"\n✗ ERROR in {script_name}")
        return False
    
    print(f"\n✓ {description} completed successfully")
    return True

def commit_batch(batch_num, verification_passed):
    """Commit batch to git"""
    print(f"\n{'='*70}")
    print(f"COMMITTING BATCH {batch_num:03d} TO GIT")
    print(f"{'='*70}\n")
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # Stage files
    subprocess.run(['git', 'add', f'books/batch_{batch_num:03d}/'], check=False)
    subprocess.run(['git', 'add', f'indices/batch_{batch_num:03d}_remedies.json'], check=False)
    subprocess.run(['git', 'add', f'verification_logs/batch_{batch_num:03d}_verification.json'], check=False)
    
    # Commit
    status = "verified" if verification_passed else "needs-review"
    commit_msg = f"Batch {batch_num:03d}: Added books with {status} [{timestamp}]"
    
    result = subprocess.run(['git', 'commit', '-m', commit_msg], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✓ Committed: {commit_msg}")
        
        # Create tag
        tag_name = f"v1.0-batch-{batch_num:03d}"
        subprocess.run(['git', 'tag', tag_name], check=False)
        print(f"✓ Tagged: {tag_name}")
        return True
    else:
        print(f"⚠ No changes to commit or git error")
        return False

def process_batch(batch_num):
    """Process a complete batch"""
    print(f"\n{'#'*70}")
    print(f"# PROCESSING BATCH {batch_num:03d}")
    print(f"{'#'*70}")
    
    start_time = datetime.now()
    
    # Step 1: Download books
    if not run_script('download_books.py', f'Downloading Batch {batch_num:03d}'):
        print("Download failed, aborting batch")
        return False
    
    # Step 2: Convert to HTML
    if not run_script('convert_to_html.py', f'Converting Batch {batch_num:03d} to HTML'):
        print("Conversion failed, aborting batch")
        return False
    
    # Step 3: Verify
    if not run_script('verify_books.py', f'Verifying Batch {batch_num:03d}'):
        print("Verification script failed")
        return False
    
    # Check verification results
    verification_file = Path(f'verification_logs/batch_{batch_num:03d}_verification.json')
    if verification_file.exists():
        with open(verification_file, 'r') as f:
            report = json.load(f)
        
        verification_passed = report['pass_rate'] >= 80
        
        print(f"\n{'='*70}")
        print(f"VERIFICATION SUMMARY")
        print(f"{'='*70}")
        print(f"Pass rate: {report['pass_rate']:.1f}%")
        print(f"Status: {'✓ PASSED' if verification_passed else '⚠ NEEDS REVIEW'}")
    else:
        verification_passed = False
    
    # Step 4: Commit to git
    commit_batch(batch_num, verification_passed)
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    print(f"\n{'#'*70}")
    print(f"# BATCH {batch_num:03d} COMPLETE")
    print(f"# Duration: {duration}")
    print(f"{'#'*70}\n")
    
    return True

def update_master_index():
    """Update master remedy index across all batches"""
    print(f"\n{'='*70}")
    print(f"UPDATING MASTER REMEDY INDEX")
    print(f"{'='*70}\n")
    
    indices_dir = Path('indices')
    all_remedies = {}
    
    # Load all batch indices
    for batch_file in sorted(indices_dir.glob('batch_*_remedies.json')):
        with open(batch_file, 'r') as f:
            batch_data = json.load(f)
        
        for book_id, book_info in batch_data.items():
            all_remedies[book_id] = book_info
    
    # Create deduplicated remedy list
    remedy_set = set()
    for book_info in all_remedies.values():
        for remedy in book_info.get('remedies', []):
            # Normalize remedy name
            normalized = remedy.strip().title()
            remedy_set.add(normalized)
    
    master_index = {
        'last_updated': datetime.now().isoformat(),
        'total_books': len(all_remedies),
        'unique_remedies_count': len(remedy_set),
        'remedies': sorted(list(remedy_set)),
        'books': all_remedies
    }
    
    with open(indices_dir / 'master_remedy_index.json', 'w') as f:
        json.dump(master_index, f, indent=2)
    
    print(f"✓ Master index created")
    print(f"  Total books: {len(all_remedies)}")
    print(f"  Unique remedies: {len(remedy_set)}")
    
    return master_index

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Process book batches')
    parser.add_argument('--batch', type=int, default=1, help='Batch number to process')
    parser.add_argument('--all', action='store_true', help='Process all batches (1-10)')
    parser.add_argument('--index-only', action='store_true', help='Only update master index')
    
    args = parser.parse_args()
    
    if args.index_only:
        update_master_index()
    elif args.all:
        for batch_num in range(1, 11):
            process_batch(batch_num)
        update_master_index()
    else:
        process_batch(args.batch)
        update_master_index()
