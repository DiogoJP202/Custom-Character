import { wheels } from '../data/wheels.ts';
import { parseArchivedGame, parseSavedGame, type GameState } from './game.ts';

export const GALLERY_STORAGE_KEY = 'jjk-character-gallery:v1';
export const MAX_CHARACTERS = 30;
export const MAX_CHARACTER_NAME = 60;
// Record v1 is the eight-chapter catalog. Future schemas must keep this boundary for v1 reads.
export const GALLERY_CATALOG_END = 'domain-expansion';
export interface GalleryCharacter {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  catalogEnd: typeof GALLERY_CATALOG_END;
  snapshot: GameState;
}
export interface GalleryState {
  records: GalleryCharacter[];
  error?: string;
}
export type GalleryResult =
  | { ok: true; gallery: GalleryState; record?: GalleryCharacter; duplicate?: true }
  | { ok: false; error: string };
export type GalleryStorage = Pick<Storage, 'getItem' | 'setItem'>;

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const fail = (error: string): GalleryResult => ({ ok: false, error });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeCharacterName(value: string): string {
  const name = value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  if (Array.from(name).length > MAX_CHARACTER_NAME)
    throw new Error(`Use até ${MAX_CHARACTER_NAME} caracteres no nome.`);
  return name;
}

function signature(snapshot: GameState): string {
  return JSON.stringify([
    snapshot.version,
    !!snapshot.legacyBirth,
    Object.entries(snapshot.results).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  ]);
}
export function findSavedCharacter(records: readonly GalleryCharacter[], state: GameState) {
  return state.phase === 'complete'
    ? records.find((record) => signature(record.snapshot) === signature(state))
    : undefined;
}
export function archiveStepIds(record: GalleryCharacter): string[] {
  return wheels
    .slice(0, wheels.findIndex((wheel) => wheel.id === record.catalogEnd) + 1)
    .map((wheel) => wheel.id);
}

function parseRecord(value: unknown): GalleryCharacter | undefined {
  if (
    !object(value) ||
    value.version !== 1 ||
    value.catalogEnd !== GALLERY_CATALOG_END ||
    typeof value.id !== 'string' ||
    !uuid.test(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    new Date(value.createdAt).toISOString() !== value.createdAt ||
    !object(value.snapshot)
  )
    return undefined;
  if (
    Object.keys(value).some(
      (key) => !['version', 'id', 'name', 'createdAt', 'catalogEnd', 'snapshot'].includes(key),
    ) ||
    Object.keys(value.snapshot).some(
      (key) => !['version', 'phase', 'stepId', 'results', 'legacyBirth'].includes(key),
    )
  )
    return undefined;
  const name = normalizeCharacterName(value.name);
  if (!name || name !== value.name) return undefined;
  const snapshot = parseArchivedGame(JSON.stringify(value.snapshot), GALLERY_CATALOG_END);
  if (!snapshot) return undefined;
  return {
    version: 1,
    id: value.id,
    name,
    createdAt: value.createdAt,
    catalogEnd: GALLERY_CATALOG_END,
    snapshot,
  };
}

export function parseGallery(raw: string | null): GalleryState {
  if (raw === null) return { records: [] };
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || !Array.isArray(value.characters))
      return {
        records: [],
        error: 'Formato de galeria incompatível. Os dados armazenados foram preservados.',
      };
    const records: GalleryCharacter[] = [];
    const ids = new Set<string>();
    const snapshots = new Set<string>();
    let invalid =
      Object.keys(value).some((key) => !['version', 'characters'].includes(key)) ||
      value.characters.length > MAX_CHARACTERS;
    for (const item of value.characters) {
      let record: GalleryCharacter | undefined;
      try {
        record = parseRecord(item);
      } catch {
        /* Keep other readable records. */
      }
      if (!record || ids.has(record.id) || snapshots.has(signature(record.snapshot))) {
        invalid = true;
        continue;
      }
      ids.add(record.id);
      snapshots.add(signature(record.snapshot));
      records.push(record);
    }
    return {
      records,
      ...(invalid
        ? {
            error:
              'Há registros inválidos, duplicados ou incompatíveis. As fichas válidas podem ser consultadas; alterações estão bloqueadas para preservar os dados.',
          }
        : {}),
    };
  } catch {
    return {
      records: [],
      error: 'Não foi possível ler a galeria: os dados estão corrompidos. Nada foi substituído.',
    };
  }
}

export function loadGallery(storage?: GalleryStorage): GalleryState {
  try {
    return parseGallery((storage ?? globalThis.localStorage).getItem(GALLERY_STORAGE_KEY));
  } catch {
    return {
      records: [],
      error:
        'Não foi possível acessar o armazenamento deste navegador. A galeria não foi alterada.',
    };
  }
}
function persist(records: GalleryCharacter[], storage?: GalleryStorage): GalleryResult {
  try {
    (storage ?? globalThis.localStorage).setItem(
      GALLERY_STORAGE_KEY,
      JSON.stringify({ version: 1, characters: records }),
    );
    return { ok: true, gallery: { records } };
  } catch {
    return fail(
      'Não foi possível salvar a alteração. O armazenamento pode estar indisponível ou cheio; nada foi confirmado.',
    );
  }
}

// Always reread immediately before a mutation, reducing stale writes across tabs.
// localStorage still provides no transaction spanning this read and the write.
export function saveCharacter(
  state: GameState,
  rawName: string,
  storage?: GalleryStorage,
): GalleryResult {
  if (state.phase !== 'complete') return fail('Conclua a criação antes de salvar na galeria.');
  const snapshot = parseArchivedGame(JSON.stringify(state), GALLERY_CATALOG_END);
  const active = parseSavedGame(JSON.stringify(state));
  if (!snapshot || active.phase !== 'complete' || signature(active) !== signature(snapshot))
    return fail('A ficha não passou pela validação dos resultados. Nenhum personagem foi salvo.');
  const gallery = loadGallery(storage);
  if (gallery.error) return fail(gallery.error);
  const existing = findSavedCharacter(gallery.records, snapshot);
  if (existing) return { ok: true, gallery, record: existing, duplicate: true };
  if (gallery.records.length >= MAX_CHARACTERS)
    return fail(
      `A galeria atingiu o limite de ${MAX_CHARACTERS} personagens. Exclua uma ficha antes de salvar outra.`,
    );
  try {
    let name = normalizeCharacterName(rawName);
    if (!name) {
      let index = 1;
      while (
        gallery.records.some(
          (record) => record.name === `Personagem ${String(index).padStart(2, '0')}`,
        )
      )
        index++;
      name = `Personagem ${String(index).padStart(2, '0')}`;
    }
    if (!globalThis.crypto?.randomUUID)
      return fail(
        'Este navegador não conseguiu gerar um identificador para a ficha. Nenhum personagem foi salvo.',
      );
    const id = globalThis.crypto.randomUUID();
    if (gallery.records.some((record) => record.id === id))
      return fail('Não foi possível identificar a nova ficha. Tente novamente.');
    const record: GalleryCharacter = {
      version: 1,
      id,
      name,
      createdAt: new Date().toISOString(),
      catalogEnd: GALLERY_CATALOG_END,
      snapshot,
    };
    const result = persist([...gallery.records, record], storage);
    return result.ok ? { ...result, record } : result;
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : 'Não foi possível preparar o personagem para salvar.',
    );
  }
}

export function renameCharacter(
  id: string,
  rawName: string,
  storage?: GalleryStorage,
): GalleryResult {
  const gallery = loadGallery(storage);
  if (gallery.error) return fail(gallery.error);
  if (!gallery.records.some((record) => record.id === id))
    return fail('Este personagem não está mais na galeria. Recarregue a coleção.');
  try {
    const name = normalizeCharacterName(rawName);
    if (!name) return fail('Informe um nome para o personagem.');
    return persist(
      gallery.records.map((record) => (record.id === id ? { ...record, name } : record)),
      storage,
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Nome inválido.');
  }
}
export function deleteCharacter(
  id: string,
  confirmed: boolean,
  storage?: GalleryStorage,
): GalleryResult {
  if (confirmed !== true) return fail('Confirme a exclusão do personagem.');
  const gallery = loadGallery(storage);
  if (gallery.error) return fail(gallery.error);
  if (!gallery.records.some((record) => record.id === id))
    return fail('Este personagem não está mais na galeria. Recarregue a coleção.');
  return persist(
    gallery.records.filter((record) => record.id !== id),
    storage,
  );
}
