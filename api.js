"use strict";

/**
 * api.js
 * Central place for server calls (frontend fetch wrappers).
 *
 * Uses JSON requests and expects JSON responses.
 * Keeps backwards compatible method names:
 *   API.register, API.login, API.logout, API.saveSession, API.getHistory
 */

const API = (() => {
  // If api.js sits beside /api folder, this is correct.
  const BASE_URL = "api";

  async function requestJSON(path, { method = "POST", data = null } = {}) {
    const options = {
      method,
      credentials: "include", // important for PHP session cookies
      headers: { "Content-Type": "application/json" },
    };

    if (data !== null) options.body = JSON.stringify(data);

    const res = await fetch(`${BASE_URL}/${path}`, options);

    const text = await res.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // If PHP echoes a warning or HTML error, this makes it easier to debug
      json = { ok: false, error: "Non-JSON response", raw: text };
    }

    // Normalize
    if (json && typeof json.ok === "boolean") return json;

    // If backend returns plain JSON without ok, wrap it
    if (res.ok) return { ok: true, ...json };

    return {
      ok: false,
      status: res.status,
      error: (json && (json.error || json.message)) || "Request failed",
      raw: json || text,
    };
  }

  async function getJSON(path) {
    return requestJSON(path, { method: "GET" });
  }

  return {
    // ---------- Auth endpoints ----------
    async authRegister(payload) {
      return requestJSON("auth/register.php", { data: payload });
    },
    async authLogin(payload) {
      return requestJSON("auth/login.php", { data: payload });
    },
    async authLogout() {
      return requestJSON("auth/logout.php", { data: {} });
    },
    async authMe() {
      return getJSON("auth/me.php");
    },

    // ---------- Game session endpoints ----------
    async startSession(payload) {
      return requestJSON("game/start_session.php", { data: payload });
    },
    async updateSession(payload) {
      return requestJSON("game/update_session.php", { data: payload });
    },
    async endSession(payload) {
      return requestJSON("game/end_session.php", { data: payload });
    },

    // ---------- Analytics endpoints ----------
    async logEvent(type, value = null, data = null) {
      return requestJSON("analytics/log_event.php", {
        data: { type, value, data },
      });
    },

    // ---------- Insights endpoints ----------
    async getInsights() {
      return getJSON("insights/get_insights.php");
    },

    // ---------- Backwards compatible methods ----------
    async register(payload) {
      return this.authRegister(payload);
    },
    async login(payload) {
      return this.authLogin(payload);
    },
    async logout() {
      return this.authLogout();
    },

    // Your original saveSession was a stub  [oai_citation:2‡api.js](sediment://file_00000000daf0722f83a5c69c8fe2e8bb).
    // We map it to update_session.php so puzzle.js can keep calling saveSession.
    async saveSession(snapshot) {
      return this.updateSession(snapshot);
    },

    // Placeholder for later: could be a real endpoint like insights history
    async getHistory() {
      // If you want, we can implement /api/insights/history.php later
      return { ok: true, sessions: [] };
    },
  };
})();
