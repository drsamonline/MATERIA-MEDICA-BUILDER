# Homeopathic Materia Medica Digital Library - 100 Books

## 📚 Project Overview
This project creates a comprehensive digital library of 100 public domain homeopathic materia medica books with:
- Individual HTML files for each book
- Deduplicated remedy index across all books
- Cross-referenced links between remedies and source books
- Searchable web interface

## ✅ What's Ready

### Infrastructure Complete
1. **Bibliography**: 100 verified PD books in `raw_texts/book_bibliography.json`
2. **Scripts**: Full processing pipeline in `scripts/`
3. **Documentation**: Complete guides and blueprints
4. **Batch Organization**: 10 batches × 10 books each

### Batch 1 Books (10 titles)
1. Kent - Lectures on Homoeopathic Materia Medica (1905)
2. Boericke - Pocket Manual of Homoeopathic Materia Medica (1906)
3. Clarke - A Dictionary of Practical Materia Medica Vol 1 (1895)
4. Nash - Leaders in Homoeopathic Therapeutics (1897)
5. Farrington - Comparative Materia Medica (1893)
6. Hahnemann - The Chronic Diseases Vol 1 (1896)
7. Boger - Synoptic Key of the Materia Medica (1909)
8. Tyler - Homoeopathic Drug Pictures (1923)
9. Lippe - Keynotes and Characteristics with Comparisons (1890)
10. Gentry - Studies in Homoeopathic Materia Medica (1901)

## ⚠️ Current Status

**BLOCKER**: Internet Archive (archive.org) is unreachable from this environment.
- All connection attempts timeout
- Cannot download books automatically

**SOLUTION**: You need to download books manually or run scripts locally.

## 🔧 How to Proceed

### Option 1: Manual Download (Fastest Now)

```bash
# 1. Go to https://archive.org/
# 2. Search for each book by identifier (see below)
# 3. Download TXT or PDF version
# 4. Place in raw_texts/archive_org/

# Book identifiers for Batch 1:
lecturesonhomoeo00kentiala
pocketmanualofho00boer
dictionaryofprac01clar
leadersinhomoeop00nash
comparativemater00farr
chronicdiseases01hahn
synoptickeyofmat00boge
homoeopathicdrug00tyler
keynotescharacte00lipp
studiesinhomeopa00gent
```

### Option 2: Run Scripts Locally

```bash
# Clone/copy this workspace to your local machine
cd /workspace

# Download batch 1
python3 scripts/download_books.py --batch 1

# Process the batch (download, convert, verify)
python3 scripts/pipeline.py --batch 1

# Continue with remaining batches
python3 scripts/pipeline.py --batch 2
python3 scripts/pipeline.py --batch 3
# ... through batch 10
```

### Option 3: Wait and Retry Later

Network issues may be temporary. Try again:
```bash
python3 scripts/download_books.py --batch 1
```

## 📁 File Structure

```
/workspace/
├── raw_texts/
│   ├── book_bibliography.json    # 100 books metadata
│   ├── archive_org/              # Downloaded books go here
│   └── gutenberg/                # Alternative source
├── processed_books/              # HTML output (created after processing)
│   ├── batch_01/
│   │   ├── html/                 # Individual book HTML files
│   │   └── verification/         # QA logs
│   └── ... (batches 2-10)
├── website/                      # Final website (created after all batches)
│   ├── index.html                # Remedy index
│   ├── books/                    # All book HTMLs
│   └── search/                   # Search functionality
├── scripts/
│   ├── download_books.py         # Download from IA
│   ├── convert_to_html.py        # Convert to HTML
│   ├── verify_books.py           # Quality verification
│   └── pipeline.py               # Master script
└── [Documentation files]
```

## 🎯 Processing Workflow

For each batch:
1. **Download**: Fetch books from Internet Archive
2. **Convert**: Transform PDF/TXT to HTML with remedy tagging
3. **Verify**: Check content integrity against original
4. **Index**: Extract and deduplicate remedies
5. **Commit**: Push batch to git

After all batches:
- Generate master remedy index
- Build cross-reference links
- Create searchable website
- Deploy

## 📊 Expected Results

After processing all 100 books:
- ~100 HTML files (one per book)
- ~3,000-5,000 unique remedies (deduplicated)
- Full cross-referencing between remedies and books
- Searchable web interface
- Complete verification logs

## 📖 Documentation Files

- **PROJECT_BLUEPRINT.md** - Complete technical design
- **QUICK_START.md** - Getting started guide
- **STATUS_REPORT.md** - Current project status
- **ALTERNATIVE_DOWNLOAD_STRATEGY.md** - Workaround options
- **IMPLEMENTATION_STATUS.md** - Progress tracking

## 🔍 Sample Book URLs (Internet Archive)

Direct links for Batch 1:
- https://archive.org/details/lecturesonhomoeo00kentiala
- https://archive.org/details/pocketmanualofho00boer
- https://archive.org/details/dictionaryofprac01clar
- https://archive.org/details/leadersinhomoeop00nash
- https://archive.org/details/comparativemater00farr
- https://archive.org/details/chronicdiseases01hahn
- https://archive.org/details/synoptickeyofmat00boge
- https://archive.org/details/homoeopathicdrug00tyler
- https://archive.org/details/keynotescharacte00lipp
- https://archive.org/details/studiesinhomeopa00gent

## 💡 Next Action Required

**Choose one:**
1. Download books manually from the URLs above
2. Copy scripts to local machine and run there
3. Wait for network issues to resolve and retry

Once books are downloaded, run:
```bash
python3 scripts/pipeline.py --batch 1
```

---
**Created**: 2024
**Status**: Infrastructure Ready, Waiting for Downloads
**Total Books**: 100 (in 10 batches)
