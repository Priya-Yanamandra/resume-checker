
// -- Constants --
const STOP_WORDS = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
    "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't",
    "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
    "will", "can", "use", "using", "used", "work", "files", "file", "please", "resume", "job", "description"
]);

// -- DOM Elements --
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('resume-file');
const fileNameDisplay = document.getElementById('file-name');
const jdTextarea = document.getElementById('jd-text');
const analyzeBtn = document.getElementById('analyze-btn');
const errorMsg = document.getElementById('error-msg');
const resultsSection = document.getElementById('results-section');
const matchPercentageEl = document.getElementById('match-percentage');
const matchedCountEl = document.getElementById('matched-count');
const missingCountEl = document.getElementById('missing-count');
const matchedList = document.getElementById('matched-list');
const missingList = document.getElementById('missing-list');
const keywordChartCanvas = document.getElementById('keywordChart');

let resumeText = "";
let chartInstance = null;

// -- Event Listeners --
dropArea.addEventListener('click', () => fileInput.click());

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--primary-color)';
    dropArea.style.backgroundColor = '#eff6ff';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = '#fafafa';
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = '#fafafa';

    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

analyzeBtn.addEventListener('click', analyzeGap);

// -- Functions --

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError("Please upload a PDF file.");
        return;
    }

    showError(""); // Clear errors
    fileNameDisplay.textContent = `Selected: ${file.name}`;

    try {
        analyzeBtn.textContent = "Extracting text...";
        analyzeBtn.disabled = true;

        resumeText = await extractTextFromPDF(file);

        analyzeBtn.textContent = "Analyze Keyword Gap";
        analyzeBtn.disabled = false;
    } catch (err) {
        console.error(err);
        showError("Failed to parse PDF. Please try a different file.");
        analyzeBtn.textContent = "Analyze Keyword Gap";
        analyzeBtn.disabled = false;
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + " ";
    }
    return fullText;
}

function normalize(text) {
    return text
        .toLowerCase()
        // Replace punctuation (except internal hyphens/dots in words if needed, but simple regex works well for general ATS gap)
        // keeping alphanumeric and spaces
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getKeywords(text) {
    const words = normalize(text).split(' ');
    const keywords = new Set();

    words.forEach(word => {
        if (word.length > 2 && !STOP_WORDS.has(word) && isNaN(word)) { // Filter short words, stopwords, numbers
            keywords.add(word);
        }
    });
    return keywords;
}

function analyzeGap() {
    const jdContent = jdTextarea.value.trim();

    if (!resumeText) {
        showError("Please upload a resume PDF first.");
        return;
    }
    if (!jdContent) {
        showError("Please paste a job description.");
        return;
    }

    showError("");

    const resumeKeywords = getKeywords(resumeText);
    const jdKeywords = getKeywords(jdContent);

    if (jdKeywords.size === 0) {
        showError("Could not identify keywords in the Job Description. Try adding more text.");
        return;
    }

    const matched = [];
    const missing = [];

    jdKeywords.forEach(keyword => {
        if (resumeKeywords.has(keyword)) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    });

    const matchScore = Math.round((matched.length / jdKeywords.size) * 100);

    displayResults(matched, missing, matchScore);
}

function displayResults(matched, missing, score) {
    resultsSection.classList.remove('hidden');

    // Update Score
    matchPercentageEl.textContent = `${score}%`;
    matchedCountEl.textContent = matched.length;
    missingCountEl.textContent = missing.length;

    // Update Lists
    // render tags
    matchedList.innerHTML = matched.map(w => `<span class="tag">${w}</span>`).join('');
    missingList.innerHTML = missing.map(w => `<span class="tag">${w}</span>`).join('');

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Update Chart
    updateChart(matched.length, missing.length);
}

function updateChart(matchedCount, missingCount) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = keywordChartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Matched', 'Missing'],
            datasets: [{
                data: [matchedCount, missingCount],
                backgroundColor: ['#dcfce7', '#fee2e2'], // light green, light red
                borderColor: ['#166534', '#991b1b'], // dark green, dark red
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We have our own legend/ui
                }
            }
        }
    });
}

function showError(msg) {
    errorMsg.textContent = msg;
}
