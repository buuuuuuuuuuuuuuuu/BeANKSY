/**
 * BeANKSY-API – Cloudflare Worker
 *
 * Benötigt im Cloudflare-Dashboard:
 *   - KV-Binding mit dem Variablennamen  BeANKSY
 *   - Secret (verschlüsselte Variable)   TOKEN   = dein geheimer Schlüssel
 *
 * Endpunkte (alle außer "/" brauchen den Token):
 *   GET  /            -> "BeANKSY-API läuft" (Funktionstest, ohne Token)
 *   GET  /data        -> kompletter Datenstand als JSON
 *   PUT  /data        -> kompletten Datenstand speichern (JSON)
 *                        ?base=<updatedAt>: Stand, den die App zuletzt kannte. Ist der gespeicherte Stand neuer,
 *                        antwortet der Worker mit 409 und dem aktuellen Stand, die App führt beides zusammen.
 *   GET  /backups     -> Liste der Tagessicherungen (je Tag der Stand vor der ersten Änderung, 30 Tage)
 *   GET  /backup/<tag> -> eine Tagessicherung, z. B. /backup/2026-11-21
 *   GET  /n/<dose-id> -> Klartext für die iPhone-Mitteilung (zählt den Scan als Bezug)
 *   GET  /uses        -> Bezüge pro Bohne als JSON { <bohnen-id>: { n, last }, _last: { tag, bean, at } }
 *                        (_last = zuletzt gescannte Dose, für die große Kachel in der App)
 *
 * Token wahlweise als Header  "Authorization: Bearer <TOKEN>"
 * oder als Parameter          "?k=<TOKEN>"  (praktisch für Kurzbefehle).
 */

const KEY = 'data';
const KEY_USES = 'uses'; // Zähler getrennt von den Daten, damit Sync sie nie überschreibt
const MAX_BYTES = 512 * 1024; // 512 KB reichen für sehr viele Bohnen
const BACKUP_PREFIX = 'backup:';
const BACKUP_TTL = 30 * 24 * 60 * 60; // Tagessicherungen löschen sich nach 30 Tagen selbst

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const EMPTY = { version: 1, updatedAt: 0, beans: [], tags: [] };

function text(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Vergleich ohne frühes Abbrechen (gegen Timing-Angriffe). */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Zahl deutsch formatieren: 18 -> "18", 12.5 -> "12,5" */
function fmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? '–');
  return num.toLocaleString('de-DE', { maximumFractionDigits: 2 });
}

/** Text für die Mitteilung: nur Name, Gramm, Mahlgrad. */
function notificationText(data, tagId) {
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const beans = Array.isArray(data.beans) ? data.beans : [];
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) return `Unbekannte Dose „${tagId}“ – in der App unter „Dosen“ anlegen.`;
  const bean = beans.find((b) => b.id === tag.beanId && !b.archived);
  if (!bean) return `${tag.label || tag.id}: keine Bohne zugeordnet.`;
  return `${bean.name}\n${fmt(bean.dose)} g · Mahlgrad ${fmt(bean.grind)}`;
}

/** Minimale Plausibilitätsprüfung der hochgeladenen Daten. */
function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Kein JSON-Objekt';
  if (!Array.isArray(data.beans)) return 'beans fehlt';
  if (!Array.isArray(data.tags)) return 'tags fehlt';
  for (const b of data.beans) {
    if (!b || typeof b.id !== 'string' || typeof b.name !== 'string') return 'Ungültige Bohne';
  }
  for (const t of data.tags) {
    if (!t || typeof t.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(t.id)) return 'Ungültige Dosen-ID';
  }
  return null;
}

async function load(env) {
  const raw = await env.BeANKSY.get(KEY);
  if (!raw) return { ...EMPTY };
  try {
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
}

async function loadUses(env) {
  try {
    return JSON.parse((await env.BeANKSY.get(KEY_USES)) || '{}') || {};
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (path === '/' && request.method === 'GET') return text('BeANKSY-API läuft ☕');

    if (!env.TOKEN) return text('TOKEN ist im Worker nicht gesetzt.', 500);
    if (!env.BeANKSY) return text('KV-Binding BeANKSY fehlt.', 500);

    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim() || url.searchParams.get('k') || '';
    if (!safeEqual(token, env.TOKEN)) return text('Nicht autorisiert', 401);

    if (path === '/data') {
      if (request.method === 'GET') return json(await load(env));

      if (request.method === 'PUT') {
        const body = await request.text();
        const raw = await env.BeANKSY.get(KEY);
        let current = { ...EMPTY };
        try { if (raw) current = JSON.parse(raw); } catch {}
        // Konfliktschutz: Hat inzwischen ein anderes Gerät gespeichert, nichts überschreiben
        const base = url.searchParams.get('base');
        if (base !== null && (Number(current.updatedAt) || 0) > (Number(base) || 0)) {
          return json({ conflict: true, data: current }, 409);
        }
        if (body.length > MAX_BYTES) return text('Daten zu groß', 413);
        let data;
        try {
          data = JSON.parse(body);
        } catch {
          return text('Ungültiges JSON', 400);
        }
        const err = validate(data);
        if (err) return text(err, 400);
        data.updatedAt = Number(data.updatedAt) || Date.now();
        // Tagessicherung: der Stand vor der ersten Änderung des Tages
        const day = new Date().toISOString().slice(0, 10);
        if (raw && !(await env.BeANKSY.get(BACKUP_PREFIX + day))) {
          await env.BeANKSY.put(BACKUP_PREFIX + day, raw, { expirationTtl: BACKUP_TTL });
        }
        await env.BeANKSY.put(KEY, JSON.stringify(data));
        return json({ ok: true, updatedAt: data.updatedAt });
      }
      return text('Methode nicht erlaubt', 405);
    }

    if (path === '/uses' && request.method === 'GET') return json(await loadUses(env));

    if (path === '/backups' && request.method === 'GET') {
      const list = await env.BeANKSY.list({ prefix: BACKUP_PREFIX });
      return json(list.keys.map((k) => k.name.slice(BACKUP_PREFIX.length)).sort().reverse());
    }
    const bk = path.match(/^\/backup\/(\d{4}-\d{2}-\d{2})$/);
    if (bk && request.method === 'GET') {
      const raw = await env.BeANKSY.get(BACKUP_PREFIX + bk[1]);
      if (!raw) return text('Keine Sicherung für diesen Tag', 404);
      return new Response(raw, { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    }

    const m = path.match(/^\/n\/([a-z0-9-]{1,40})$/);
    if (m && request.method === 'GET') {
      const data = await load(env);
      const tag = (data.tags || []).find((t) => t.id === m[1]);
      const bean = tag && (data.beans || []).find((b) => b.id === tag.beanId && !b.archived);
      if (bean) {
        const uses = await loadUses(env);
        const u = uses[bean.id] || { n: 0, last: 0 };
        const now = Date.now();
        uses[bean.id] = { n: u.n + 1, last: now };
        uses._last = { tag: tag.id, bean: bean.id, at: now };
        await env.BeANKSY.put(KEY_USES, JSON.stringify(uses));
      }
      return text(notificationText(data, m[1]));
    }

    return text('Nicht gefunden', 404);
  },
};
