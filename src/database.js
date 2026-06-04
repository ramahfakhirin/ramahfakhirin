// src/database.js — SQLite setup with all tables
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || 'database/app.db');

// Ensure directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`

  -- Admin user
  CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Portfolio projects
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    category    TEXT NOT NULL CHECK(category IN ('yearbook','web','event','ar','other')),
    description TEXT,
    content     TEXT,
    thumbnail   TEXT,
    url         TEXT,
    tags        TEXT DEFAULT '[]',
    featured    INTEGER DEFAULT 0,
    published   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- Blog posts
  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    excerpt     TEXT,
    content     TEXT NOT NULL,
    thumbnail   TEXT,
    tags        TEXT DEFAULT '[]',
    published   INTEGER DEFAULT 0,
    views       INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- Contact form submissions
  CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT,
    message     TEXT NOT NULL,
    status      TEXT DEFAULT 'new' CHECK(status IN ('new','read','replied','archived')),
    ip          TEXT,
    user_agent  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Analytics: page views
  CREATE TABLE IF NOT EXISTS analytics_views (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    page        TEXT NOT NULL,
    referrer    TEXT,
    country     TEXT,
    device      TEXT CHECK(device IN ('desktop','mobile','tablet')),
    browser     TEXT,
    session_id  TEXT,
    ip          TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Analytics: events (clicks, form submits, etc)
  CREATE TABLE IF NOT EXISTS analytics_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name  TEXT NOT NULL,
    event_data  TEXT DEFAULT '{}',
    page        TEXT,
    session_id  TEXT,
    ip          TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Analytics: daily summary (pre-aggregated for fast dashboard)
  CREATE TABLE IF NOT EXISTS analytics_daily (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL,
    page        TEXT NOT NULL,
    views       INTEGER DEFAULT 0,
    unique_ips  TEXT DEFAULT '[]',
    UNIQUE(date, page)
  );

  -- Site settings (key-value)
  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
  CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published);
  CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
  CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
  CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
  CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics_views(page);
  CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_views(created_at);
  CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
`);

module.exports = db;
