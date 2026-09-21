# Homeopathic Materia Medica Digital Library - Project Blueprint

## Project Overview
A comprehensive digital library of freely available, open-domain homeopathic materia medica books converted to HTML format with advanced search, indexing, and cross-referencing capabilities.

## Target: 100+ Open Domain Books

### Primary Sources for Books:
1. **Internet Archive (archive.org)** - Largest collection of public domain books
2. **Project Gutenberg** - Public domain texts
3. **HathiTrust Digital Library** - Academic partner collections
4. **Google Books** - Public domain section
5. **Homeopathy Online Library** - Specialized collections
6. **National Library of Medicine (NLM)** - Historical medical texts
7. **Wellcome Library** - Medical history collections
8. **Biodiversity Heritage Library** - Some botanical materia medica

### Key Book Categories:
- Classical Materia Medica (Hahnemann, Kent, Boericke, etc.)
- Repertories
- Organon and Philosophical Works
- Clinical Guides
- Combination Remedies
- Regional/National Schools (British, American, Indian, European)
- Modern Interpretations (pre-1928 for public domain in US)

---

## Technical Architecture

### Directory Structure
```
/workspace/
├── books/                    # All book HTML files
│   ├── batch_001/           # Books 1-10
│   ├── batch_002/           # Books 11-20
│   └── ...
├── raw_texts/               # Original downloaded texts
│   ├── archive_org/
│   ├── gutenberg/
│   └── ...
├── processed/               # Intermediate processing files
├── indices/                 # Generated indices
│   ├── remedies_index.json
│   ├── books_index.json
│   └── cross_references.json
├── scripts/                 # Processing scripts
│   ├── downloader.py
│   ├── converter.py
│   ├── indexer.py
│   └── verifier.py
├── website/                 # Final website files
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── books/
└── verification_logs/       # Verification reports
```

### Data Flow Pipeline
```
1. Discovery → 2. Download → 3. OCR (if needed) → 4. Text Extraction → 
5. HTML Conversion → 6. Remedy Extraction → 7. Indexing → 8. Verification → 
9. Git Commit → 10. Website Generation
```

---

## Book Processing Workflow

### Phase 1: Book Discovery & Metadata Collection
- Search APIs and catalogs for open-domain homeopathic books
- Extract metadata: Title, Author, Year, Publisher, Pages, Language
- Verify public domain status (pre-1928 for US, varies by country)
- Create master bibliography

### Phase 2: Batch Download (10 books per batch)
- Download in batches of 10 books
- Store raw formats (PDF, TXT, DJVU, etc.)
- Log download status and source URLs
- Implement retry logic for failed downloads

### Phase 3: Text Extraction & Conversion
- PDF → Text (using pdfplumber, PyMuPDF)
- DJVU → Text (using djvulibre)
- Image scans → OCR (using Tesseract)
- Clean and normalize text
- Preserve structure (chapters, sections, paragraphs)

### Phase 4: HTML Conversion
Each book converted to structured HTML with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="book-id" content="BOOK_001">
    <meta name="author" content="Kent, J.T.">
    <meta name="year" content="1905">
    <title>Lectures on Homoeopathic Materia Medica - Kent</title>
    <link rel="stylesheet" href="../css/book.css">
</head>
<body>
    <nav class="book-navigation">...</nav>
    <article class="book-content">
        <section class="remedy" id="remedy-abrus-precatorius">
            <h2>Abrus Precatorius</h2>
            <div class="remedy-content">...</div>
        </section>
        <!-- More remedies -->
    </article>
    <footer class="book-footer">...</footer>
</body>
</html>
```

### Phase 5: Remedy Extraction & Indexing
- Parse each book for remedy names
- Standardize remedy names (synonyms handling)
- Create global remedy index
- Map remedies to books and page/section locations

### Phase 6: Verification
- Random sampling verification (10% of each book)
- Compare extracted text with original images/PDF
- Check for OCR errors
- Validate remedy names against standard lists
- Generate verification report

### Phase 7: Git Integration
- Each batch committed separately
- Commit message format: "Batch XX: Added books [list] with verification"
- Tag releases: v1.0-batch-001, v1.0-batch-002, etc.
- Maintain CHANGELOG

---

## Website Features

### Core Features (MVP)
1. **Home Page**
   - Search bar (global search across all books)
   - Browse by author
   - Browse by remedy
   - Recently added books
   - Statistics (total books, total remedies, etc.)

2. **Book Browser**
   - Grid/List view of all books
   - Filter by author, year, category
   - Book preview
   - Download options (HTML, PDF, EPUB)

3. **Remedy Index**
   - Alphabetical listing of all unique remedies
   - Count of books containing each remedy
   - Quick navigation (A-Z)

4. **Book Reader**
   - Clean reading interface
   - Table of contents navigation
   - Search within book
   - Bookmark functionality
   - Font size adjustment
   - Dark/Light mode

5. **Remedy Detail Page**
   - Shows remedy information from ALL books
   - Side-by-side or tabbed comparison
   - Links back to source books
   - Cross-references

### Advanced Features (Future Phases)
1. **Advanced Search**
   - Full-text search with highlighting
   - Boolean operators (AND, OR, NOT)
   - Fuzzy matching for typos
   - Search filters (author, year, book)
   - Phrase search
   - Proximity search

2. **AI-Powered Features**
   - Symptom-based remedy suggestions
   - Natural language queries
   - Automatic summarization
   - Relationship mapping between remedies

3. **Comparison Tools**
   - Select multiple books for side-by-side comparison
   - Highlight differences in remedy descriptions
   - Venn diagram of remedy coverage

4. **User Features**
   - User accounts (optional)
   - Personal notes and annotations
   - Reading lists
   - Export citations
   - Share specific passages

5. **Analytics & Visualization**
   - Remedy frequency across literature
   - Historical timeline of remedy discoveries
   - Author influence networks
   - Word clouds for each remedy

6. **API Access**
   - RESTful API for developers
   - Bulk data export
   - Webhook support

7. **Mobile Optimization**
   - Responsive design
   - Progressive Web App (PWA)
   - Offline reading capability

8. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader optimization
   - Keyboard navigation
   - High contrast modes

9. **Multi-language Support**
   - Interface translation
   - Original language preservation
   - Auto-translation option (future)

10. **Community Features**
    - User contributions (corrections, notes)
    - Discussion forums
    - Rating and reviews
    - Collaborative tagging

---

## Batch Processing Strategy

### Batch Size: 10 books
### Batches Required: 10 batches (for 100 books)

### Batch Workflow:
```
For each batch:
1. Select 10 books from priority list
2. Download and store raw files
3. Process and convert to HTML
4. Extract remedies and update indices
5. Run verification checks
6. Generate verification report
7. Commit to git with verification log
8. Update master index
9. Proceed to next batch
```

### Priority Order for Books:
**Tier 1 (Essential Classics - Batch 1-3):**
1. Kent's Lectures on Homoeopathic Materia Medica
2. Boericke's Pocket Manual of Homoeopathic Materia Medica
3. Hahnemann's Materia Medica Pura
4. Allen's Encyclopedia of Homoeopathic Materia Medica (selected volumes)
5. Clarke's Dictionary of Practical Materia Medica
6. Nash's Leaders in Homoeopathic Therapeutics
7. Hughes' Cyclopaedia of Drug Pathogenesy (selected)
8. Farrington's Comparative Materia Medica
9. Boger's Synoptic Key
10. Tyler's Homoeopathic Drug Pictures

**Tier 2 (Important Works - Batch 4-6):**
- Pulford's Keynotes
- Lippe's Keynotes
- Gentry's Studies in Homeopathic Materia Medica
- Dewey's Essentials of Homoeopathic Materia Medica
- Guernsey's Applied Therapeutics
- Hering's Guiding Symptoms
- And more...

**Tier 3 (Supplementary - Batch 7-10):**
- Regional materia medica
- Specialized works
- Lesser-known but valuable texts
- Complete sets of series

---

## Quality Assurance

### Verification Checklist:
- [ ] Text matches original (sample check)
- [ ] All remedies identified and tagged
- [ ] HTML validates without errors
- [ ] Navigation works correctly
- [ ] Cross-references functional
- [ ] No missing pages or sections
- [ ] Formatting preserved appropriately
- [ ] Metadata accurate

### Error Handling:
- Log all errors during processing
- Manual review for low-confidence OCR
- Flag uncertain remedy identifications
- Maintain errata file

---

## Technology Stack

### Backend/Processing:
- Python 3.12+
- requests, BeautifulSoup4 (web scraping)
- pdfplumber, PyMuPDF (PDF processing)
- pytesseract (OCR)
- lxml (XML/HTML processing)
- json (data storage)

### Frontend:
- HTML5, CSS3, JavaScript (vanilla)
- Optional: Vue.js or React for interactive features
- Elasticsearch or Lunr.js for search

### Infrastructure:
- Git for version control
- GitHub/GitLab for hosting
- Static site hosting (GitHub Pages, Netlify)
- Optional: Docker for containerization

---

## Timeline Estimate

- **Planning & Setup**: 1 day
- **Batch Processing (10 batches)**: 10-15 days
  - Each batch: 1-1.5 days including verification
- **Website Development**: 3-5 days
- **Testing & Refinement**: 2-3 days
- **Total**: ~18-24 days for complete 100-book library

---

## Legal & Ethical Considerations

1. **Public Domain Verification**: Ensure all books are truly open domain
2. **Attribution**: Always credit original authors and sources
3. **No Modifications**: Preserve original text integrity
4. **Transparency**: Document all processing steps
5. **Non-Commercial**: Keep resource freely available

---

## Success Metrics

- ✓ 100+ books successfully digitized
- ✓ 99%+ accuracy in text extraction
- ✓ Complete remedy index (deduplicated)
- ✓ All cross-references working
- ✓ Fast search (<500ms response)
- ✓ Mobile-friendly interface
- ✓ Accessibility compliant
- ✓ Positive user feedback

---

## Next Steps

1. Create directory structure
2. Build book discovery script
3. Generate initial bibliography
4. Process Batch 1 (10 priority books)
5. Verify and commit
6. Iterate through remaining batches
7. Build website frontend
8. Deploy and test

---

*This blueprint will be updated as the project progresses.*
