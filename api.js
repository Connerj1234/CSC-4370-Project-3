"use strict";

/**
 * api.js
 * Central place for server calls.
 * For now: stubs that log + (optionally) POST to endpoints later.
 */
const API = (() => {
  // Change this later if you put endpoints in a different folder
  const BASE_URL = "api";

  async function postJSON(path, data) {
    const res = await fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // If backend returns non-JSON later, we’ll adjust.
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: res.ok, raw: text };
    }
  }

  return {
    async saveSession(snapshot) {
      // For now, just log so you can confirm it fires.
      console.log("API.saveSession called with:", snapshot);

      // Later, when we implement PHP:
      // return await postJSON("save_session.php", snapshot);

      return { ok: true, mocked: true };
    },

    async register(payload) {
      console.log("API.register:", payload);
      // return await postJSON("register.php", payload);
      return { ok: true, mocked: true };
    },

    async login(payload) {
      console.log("API.login:", payload);
      // return await postJSON("login.php", payload);
      return { ok: true, mocked: true };
    },

    async logout() {
      console.log("API.logout");
      // return await postJSON("logout.php", {});
      return { ok: true, mocked: true };
    },

    async getHistory() {
      console.log("API.getHistory");
      // Later could be GET request:
      // const res = await fetch(`${BASE_URL}/history.php`);
      // return await res.json();
      return { ok: true, mocked: true, sessions: [] };
    },
  };
})();
