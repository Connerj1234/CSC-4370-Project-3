"use strict";

/**
 * api.js
 * Client for the PHP API endpoints (uses fetch + PHP sessions).
 *
 * NOTE: All requests use credentials: "include" so PHP session cookies work.
 */
const API = (() => {
  const BASE_URL = "./api";

  async function request(path, { method = "GET", body } = {}) {
    const opts = {
      method,
      credentials: "include",
      headers: {},
    };

    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}/${path}`, opts);

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      // fall back to text if server returns non-json
      const text = await res.text();
      data = { ok: res.ok, raw: text };
    }

    if (!res.ok || (data && data.ok === false)) {
      const msg =
        (data && (data.error || data.message)) ||
        `Request failed: ${method} ${path} (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  return {
    // Auth
    async register(payload) {
      return await request("auth/register.php", { method: "POST", body: payload });
    },
    async login(payload) {
      return await request("auth/login.php", { method: "POST", body: payload });
    },
    async logout() {
      return await request("auth/logout.php", { method: "POST", body: {} });
    },
    async me() {
      return await request("auth/me.php", { method: "GET" });
    },

    // Game sessions
    async startSession(payload) {
      // payload: { grid_size, difficulty_level, puzzle_id?, puzzle? }
      return await request("game/start_session.php", { method: "POST", body: payload });
    },
    async updateSession(payload) {
      // payload: { session_id, moves_count, difficulty_level, magic_used, powerups_used?, final_state? }
      return await request("game/update_session.php", { method: "POST", body: payload });
    },
    async endSession(payload) {
      // payload: { session_id, completed, completion_time_s?, moves_count, difficulty_level, magic_used, powerups_used?, final_state? }
      return await request("game/end_session.php", { method: "POST", body: payload });
    },

    // Analytics + insights
    async logEvent(payload) {
      // payload: { event_type, meta? }
      return await request("analytics/log_event.php", { method: "POST", body: payload });
    },
    async getInsights() {
      return await request("insights/get_insights.php", { method: "GET" });
    },
  };
})();
