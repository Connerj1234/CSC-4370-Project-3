"use strict";

/**
 * api.js
 * Real client for the PHP API endpoints (no mocks).
 */
const API = (() => {
  const BASE_URL = "./api";

  async function request(path, { method = "GET", body } = {}) {
    const opts = {
      method,
      credentials: "include", // REQUIRED for PHP sessions
      headers: {},
    };

    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}/${path}`, opts);

    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { ok: false, error: "Non-JSON response from server" };
    }

    if (!res.ok && data && data.ok !== true) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return data;
  }

  return {
    async register(payload) {
      // payload: { username, email, password } or whatever your register.php expects
      return await request("auth/register.php", { method: "POST", body: payload });
    },

    async login(payload) {
      // payload: { usernameOrEmail, password } OR { username, password } depending on your login.php
      return await request("auth/login.php", { method: "POST", body: payload });
    },

    async logout() {
      return await request("auth/logout.php", { method: "POST", body: {} });
    },

    async me() {
      return await request("auth/me.php", { method: "GET" });
    },
  };
})();
