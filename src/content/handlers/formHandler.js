/**
 * Form data handler
 * @module formHandler
 */

/**
 * Extracts all form field data
 * @param {HTMLFormElement} form
 * @returns {object}
 */
export function extractFormData(form) {
  if (!form) return {};
  const data = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    if (key in data) {
      if (!Array.isArray(data[key])) data[key] = [data[key]];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }
  return data;
}

/**
 * Fills a form with data
 * @param {HTMLFormElement} form
 * @param {object} data - Field name → value map
 */
export function fillForm(form, data) {
  if (!form || !data) return;
  Object.entries(data).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) return;
    if (field.type === 'checkbox') {
      field.checked = !!value;
    } else if (field.type === 'radio') {
      const radio = form.querySelector(`[name="${name}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else if (field.tagName === 'SELECT') {
      field.value = value;
    } else {
      field.value = value;
    }
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/**
 * Submits a form programmatically
 * @param {HTMLFormElement} form
 * @returns {Promise<void>}
 */
export async function submitForm(form) {
  if (!form) throw new Error('Form element is required');
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  const cancelled = !form.dispatchEvent(submitEvent);
  if (!cancelled) form.submit();
}
