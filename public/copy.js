/**
 * @param {`clipboard-${'read' | 'write'}`} name
 */
async function requestPermission(name) {
  try {
    const permission = await navigator.permissions.query({
      // @ts-expect-error clipboard-write is not yet supported in
      // all browsers and it is not in lib.dom.
      name,
    });

    if (permission.state === "denied") {
      throw new Error("Not allowed to write to clipboard.");
    }

    return undefined;
  } catch (error) {
    return error;
  }
}

/**
 * @param {string} text
 */
async function copyText(text) {
  const permissionError = await requestPermission("clipboard-write");

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    throw permissionError ?? error;
  }
}

/**
 * @param {HTMLElement} element
 */
async function copyCode(element) {
  const code = element.previousElementSibling;
  if (!code) return;

  await copyText(code.textContent);
  element.textContent = "Copied!";

  const t = new Date().toISOString();
  element.dataset.t = t;

  setTimeout(() => {
    if (element.dataset.t !== t) return;
    element.textContent = "Copy";
  }, 5000);
}
