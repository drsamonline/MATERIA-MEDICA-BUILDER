# Alternative Download Strategy for Homeopathic Books

## Problem
Internet Archive (archive.org) is currently unreachable from this environment due to network timeouts. All connection attempts to archive.org are failing with ConnectTimeoutError.

## Solution Options

### Option 1: Manual Download (Recommended)
1. Use the bibliography file `raw_texts/book_bibliography.json` which contains all 100 book identifiers
2. Download books manually from: https://archive.org/
3. Place downloaded files in `raw_texts/archive_org/` directory
4. Run the conversion pipeline once files are available

### Option 2: Direct Download Script (Run Locally)
Copy and run this script on your local machine with better IA connectivity:

```bash
python3 scripts/download_books.py --batch 1
```

### Option 3: Alternative Sources
Some homeopathic texts may be available from:
- Project Gutenberg (gutenberg.org)
- HathiTrust (hathitrust.org)
- Google Books (books.google.com)
- Homeopathic library websites

## Bibliography File Location
`/workspace/raw_texts/book_bibliography.json`

Contains 100 books organized in 10 batches with:
- Book titles
- Authors
- Publication years
- Internet Archive identifiers
- Batch assignments

## Next Steps Once Books Are Downloaded

1. **Verify downloads:**
   ```bash
   python3 scripts/verify_books.py --batch 1
   ```

2. **Convert to HTML:**
   ```bash
   python3 scripts/convert_to_html.py --batch 1
   ```

3. **Generate remedy index:**
   ```bash
   python3 scripts/generate_index.py
   ```

4. **Build website:**
   ```bash
   python3 scripts/build_website.py
   ```

## Book List Preview (Batch 1)
1. Kent - Lectures on Homeopathic Materia Medica (ia: lecturesonhomoe00kent)
2. Boericke - Pocket Manual of Homeopathic Materia Medica (ia: pocketmanualofho00boer)
3. Clarke - Dictionary of Practical Materia Medica Vol 1 (ia: dictionaryofprac01clar)
4. Nash - Leaders in Homeopathic Therapeutics (ia: leadersinhomeopa00nash)
5. Farrington - Clinical Materia Medica (ia: clinicalmateria00farr)
6. Hahnemann - Organon of Medicine (ia: organonofmedicin00hahn)
7. Boger - Synoptic Key of Materia Medica (ia: synoptickeyofmat00boge)
8. Tyler - Materia Medica with Notes (ia: materiaedicawit00tyler)
9. Lippe - Textbook of Materia Medica (ia: textbookofmateri00lipp)
10. Gentry - Guiding Symptoms Vol 1 (ia: guidingsymptoms01gent)

## Contact
If you continue to experience issues, consider:
- Running the download script from a different network
- Using a VPN to access archive.org
- Downloading books during off-peak hours
