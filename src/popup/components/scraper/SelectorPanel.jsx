import React, { useState } from 'react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import { isValidCssSelector } from '../../utils/validators.js';
import { MESSAGES } from '../../../../shared/constants/messages.js';

/**
 * @param {{ selectors: Array, onSelectorsChange: Function }} props
 */
export default function SelectorPanel({ selectors = [], onSelectorsChange }) {
  const [newSelector, setNewSelector] = useState({ name: '', cssSelector: '', type: 'text', multiple: false });
  const [error, setError] = useState('');

  const addSelector = () => {
    if (!newSelector.name.trim()) { setError('Name is required'); return; }
    if (!newSelector.cssSelector.trim()) { setError('CSS selector is required'); return; }
    if (!isValidCssSelector(newSelector.cssSelector)) { setError('Invalid CSS selector'); return; }
    setError('');
    onSelectorsChange([...selectors, { ...newSelector, id: Date.now().toString() }]);
    setNewSelector({ name: '', cssSelector: '', type: 'text', multiple: false });
  };

  const removeSelector = (id) => onSelectorsChange(selectors.filter(s => s.id !== id));

  const startVisualSelect = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: MESSAGES.SELECT_START });
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selectors</h3>
        <Button size="xs" variant="secondary" onClick={startVisualSelect}>🖱 Pick Element</Button>
      </div>

      <div className="space-y-2">
        <Input placeholder="Field name (e.g. title)" value={newSelector.name}
          onChange={e => setNewSelector(p => ({ ...p, name: e.target.value }))} />
        <Input placeholder="CSS selector (e.g. h1.title)" value={newSelector.cssSelector}
          onChange={e => setNewSelector(p => ({ ...p, cssSelector: e.target.value }))} />
        <div className="flex gap-2 items-center">
          <select value={newSelector.type} onChange={e => setNewSelector(p => ({ ...p, type: e.target.value }))}
            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200">
            {['text', 'link', 'image', 'table', 'list', 'custom'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={newSelector.multiple}
              onChange={e => setNewSelector(p => ({ ...p, multiple: e.target.checked }))} />
            Multiple
          </label>
          <Button size="xs" onClick={addSelector}>Add</Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {selectors.length > 0 && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {selectors.map(sel => (
            <div key={sel.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-50 dark:bg-slate-700 group">
              <div className="min-w-0">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">{sel.name}</span>
                <span className="text-xs text-gray-400 truncate block font-mono">{sel.cssSelector}</span>
              </div>
              <button onClick={() => removeSelector(sel.id)}
                className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
