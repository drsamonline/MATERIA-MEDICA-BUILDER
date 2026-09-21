#!/usr/bin/env python3
"""Test downloading a single book from Internet Archive"""
import requests
import json
from pathlib import Path

# First book from batch 1: Kent's Lectures on Homeopathic Materia Medica
ia_id = "lecturesonhomoe00kent"
title = "Lectures on Homeopathic Materia Medica by Kent"

print(f"Testing download for: {title}")
print(f"IA Identifier: {ia_id}")
print("-" * 60)

# Test 1: Metadata endpoint
print("\n1. Testing metadata endpoint...")
try:
    metadata_url = f"https://archive.org/metadata/{ia_id}"
    print(f"   URL: {metadata_url}")
    response = requests.get(metadata_url, timeout=15)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        metadata = response.json()
        print(f"   ✓ Metadata retrieved successfully")
        print(f"   Title from IA: {metadata.get('metadata', {}).get('title', 'N/A')}")
    else:
        print(f"   ✗ Failed with status {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Text file availability
print("\n2. Testing text file availability...")
try:
    text_url = f"https://archive.org/download/{ia_id}/{ia_id}.txt"
    print(f"   URL: {text_url}")
    response = requests.get(text_url, timeout=15)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✓ Text file available ({len(response.content)} bytes)")
        # Save it
        output_dir = Path("raw_texts/archive_org")
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / f"{ia_id}.txt", 'wb') as f:
            f.write(response.content)
        print(f"   ✓ Saved to raw_texts/archive_org/{ia_id}.txt")
    else:
        print(f"   ✗ Text file not available (status {response.status_code})")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: PDF file availability
print("\n3. Testing PDF file availability...")
try:
    pdf_url = f"https://archive.org/download/{ia_id}/{ia_id}.pdf"
    print(f"   URL: {pdf_url}")
    response = requests.head(pdf_url, timeout=15)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        size = response.headers.get('content-length', 'unknown')
        print(f"   ✓ PDF available ({size} bytes)")
    else:
        print(f"   ✗ PDF not available (status {response.status_code})")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Test complete!")
