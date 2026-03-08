// ── HTTP / JSON helpers

export async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok)
    throw new Error(`Failed to load ${path}: ${response.status}`);

  return response.json();
}
