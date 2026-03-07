'use strict';

/**
 * Traditional server-side pattern recognition service.
 *
 * Analyses raw HTML text to identify data patterns without AI.
 * Returns structured selector suggestions and a best-guess schema.
 *
 * Approach:
 *  1. Token-frequency analysis of class/id names
 *  2. Structural repetition detection (repeating sibling tags)
 *  3. Content-type fingerprinting (price, date, link, image, rating…)
 *  4. Schema inference from detected field types
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Very light HTML "tokeniser": extract all opening tags with class/id
 * attributes from a raw HTML string. Works without a DOM parser so it
 * runs on the server.
 */
function extractTags(html) {
  const tags = [];
  // Match opening tags: <tag attr1="val" attr2="val">
  const tagRe = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const tagName = m[1].toLowerCase();
    const attrsStr = m[2];
    const classMatch = attrsStr.match(/class="([^"]*)"/i);
    const idMatch    = attrsStr.match(/id="([^"]*)"/i);
    tags.push({
      tag:     tagName,
      classes: classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [],
      id:      idMatch    ? idMatch[1] : null,
    });
  }
  return tags;
}

/**
 * Compute tag-level repetition counts.
 * Returns { tagName → count } map.
 */
function countTagRepetitions(tags) {
  const counts = {};
  for (const { tag } of tags) {
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

/**
 * Score a CSS class name for semantic relevance.
 * Higher = more likely to be data-bearing.
 */
const FIELD_PATTERNS = [
  { re: /price|cost|amount|fee|rate/i,   name: 'price',       score: 10 },
  { re: /title|heading|name|label/i,     name: 'title',       score: 9  },
  { re: /desc|summary|abstract|body/i,   name: 'description', score: 8  },
  { re: /img|image|photo|thumb/i,        name: 'image',       score: 7  },
  { re: /link|url|href/i,                name: 'link',        score: 6  },
  { re: /date|time|when|publish|create/i,name: 'date',        score: 6  },
  { re: /rating|star|score|review/i,     name: 'rating',      score: 5  },
  { re: /author|writer|by/i,             name: 'author',      score: 4  },
  { re: /category|tag|label|badge/i,     name: 'category',    score: 3  },
  { re: /card|item|product|result|row/i, name: 'container',   score: 2  },
];

function classToFieldType(cls) {
  for (const { re, name, score } of FIELD_PATTERNS) {
    if (re.test(cls)) return { name, score };
  }
  return null;
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Detect repeating structural patterns in HTML.
 *
 * @param {string} html   Raw HTML string
 * @returns {Array<{selector: string, count: number, likelyType: string, confidence: string}>}
 */
function detectRepeatingPatterns(html) {
  if (!html || typeof html !== 'string') return [];

  const tags = extractTags(html);
  const tagCounts = countTagRepetitions(tags);

  const REPEATING_CONTAINERS = [
    'li', 'tr', 'article', 'section', 'div', 'span',
  ];

  const results = [];

  for (const container of REPEATING_CONTAINERS) {
    const count = tagCounts[container] || 0;
    if (count < 3) continue; // not enough repetitions to be meaningful

    // Look for container tags that have semantically rich class names
    const containerTags = tags.filter(t => t.tag === container);
    const classCandidates = {};

    for (const t of containerTags) {
      for (const cls of t.classes) {
        const field = classToFieldType(cls);
        if (field && field.name === 'container') {
          classCandidates[cls] = (classCandidates[cls] || 0) + 1;
        }
      }
    }

    // Skip if no container-class candidates found
    if (Object.keys(classCandidates).length === 0) continue;

    // Find the most common class for this container tag
    const [bestClass] = Object.entries(classCandidates).sort((a, b) => b[1] - a[1]);
    const selector = bestClass ? `${container}.${bestClass[0]}` : container;

    results.push({
      selector,
      count,
      likelyType: 'list-item',
      confidence: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
    });
  }

  return results;
}

/**
 * Suggest CSS selectors for common field types by scanning class/id names.
 *
 * @param {string} html
 * @returns {Array<{name: string, selector: string, description: string, confidence: string}>}
 */
function suggestFieldSelectors(html) {
  if (!html || typeof html !== 'string') return [];

  const tags = extractTags(html);

  // Accumulate candidate selectors per field type
  const fieldMap = {};  // fieldName → { selector, score, count }

  for (const { tag, classes, id } of tags) {
    // Score from id
    if (id) {
      const ft = classToFieldType(id);
      if (ft) {
        const sel = `#${id}`;
        if (!fieldMap[ft.name] || fieldMap[ft.name].score < ft.score + 2) {
          fieldMap[ft.name] = { selector: sel, score: ft.score + 2, count: 1 };
        }
      }
    }

    // Score from class names
    for (const cls of classes) {
      const ft = classToFieldType(cls);
      if (!ft || ft.name === 'container') continue;

      const sel = `${tag}.${cls}`;
      if (!fieldMap[ft.name]) {
        fieldMap[ft.name] = { selector: sel, score: ft.score, count: 1 };
      } else {
        fieldMap[ft.name].count++;
        if (ft.score > fieldMap[ft.name].score) {
          fieldMap[ft.name] = { selector: sel, score: ft.score, count: fieldMap[ft.name].count };
        }
      }
    }
  }

  return Object.entries(fieldMap).map(([name, info]) => ({
    name,
    selector: info.selector,
    description: `Detected ${name} field`,
    confidence: info.count > 3 ? 'high' : info.count > 1 ? 'medium' : 'low',
  }));
}

/**
 * Infer a data schema from HTML by combining pattern and field detection.
 *
 * @param {string} html
 * @returns {{ fields: Array<{name, selector, type}>, patternType: string, confidence: string }}
 */
function inferSchema(html) {
  const patterns = detectRepeatingPatterns(html);
  const fields   = suggestFieldSelectors(html);

  // Determine overall pattern type
  let patternType = 'unknown';
  if (patterns.length > 0) {
    const top = patterns.sort((a, b) => b.count - a.count)[0];
    if (top.selector.includes('tr'))      patternType = 'table';
    else if (top.selector.includes('li')) patternType = 'list';
    else                                   patternType = 'cards';
  }

  // Map field names to likely data types
  const typeMap = {
    price:       'number',
    title:       'string',
    description: 'string',
    image:       'url',
    link:        'url',
    date:        'date',
    rating:      'number',
    author:      'string',
    category:    'string',
  };

  const schemaFields = fields.map(f => ({
    name:     f.name,
    selector: f.selector,
    type:     typeMap[f.name] || 'string',
  }));

  const overallConfidence =
    schemaFields.length > 4  ? 'high' :
    schemaFields.length > 1  ? 'medium' : 'low';

  return { fields: schemaFields, patternType, confidence: overallConfidence };
}

/**
 * Run the full traditional analysis pipeline on HTML content.
 *
 * @param {string} html
 * @returns {{
 *   patterns:         Array,
 *   suggestedSelectors: Array,
 *   schema:           object,
 *   summary:          string,
 * }}
 */
function analyzeHtml(html) {
  const patterns  = detectRepeatingPatterns(html);
  const selectors = suggestFieldSelectors(html);
  const schema    = inferSchema(html);

  const topPattern = patterns[0];
  let summary = 'No repeating pattern detected.';
  if (topPattern) {
    summary = `Detected ${topPattern.count} repeating "${topPattern.selector}" elements — likely a ${schema.patternType} layout.`;
  }
  if (selectors.length) {
    summary += ` Found ${selectors.length} field selector(s): ${selectors.map(s => s.name).join(', ')}.`;
  }

  return { patterns, suggestedSelectors: selectors, schema, summary };
}

module.exports = {
  analyzeHtml,
  detectRepeatingPatterns,
  suggestFieldSelectors,
  inferSchema,
};
