"""Smart Talent Engine — SQLite async database helpers."""

import json
import aiosqlite
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "smart_talent.db")


async def init_db():
    """Create tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                requirements_json TEXT DEFAULT '[]',
                status TEXT DEFAULT 'created',
                resume_count INTEGER DEFAULT 0,
                top_score REAL,
                hidden_gem_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                candidate_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                name TEXT DEFAULT 'Unknown',
                email TEXT,
                resume_format TEXT,
                filename TEXT,
                parse_confidence REAL DEFAULT 0.0,
                profile_json TEXT NOT NULL,
                raw_text TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS match_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                compatibility_score REAL DEFAULT 0.0,
                result_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(candidate_id, job_id),
                FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id),
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS batch_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                status TEXT DEFAULT 'queued',
                skills_found INTEGER DEFAULT 0,
                error TEXT,
                candidate_id TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)
        await db.commit()


# ── Job helpers ─────────────────────────────────────────────

async def save_job(job_id: str, title: str, description: str, requirements_json: str = "[]"):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO jobs (job_id, title, description, requirements_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (job_id, title, description, requirements_json, datetime.utcnow().isoformat())
        )
        await db.commit()


async def get_job(job_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def list_jobs() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM jobs ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def update_job(job_id: str, **kwargs):
    if not kwargs:
        return
    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [job_id]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE jobs SET {set_clause} WHERE job_id = ?", values)
        await db.commit()


async def delete_job(job_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM match_results WHERE job_id = ?", (job_id,))
        await db.execute("DELETE FROM batch_status WHERE job_id = ?", (job_id,))
        await db.execute("DELETE FROM candidates WHERE job_id = ?", (job_id,))
        await db.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
        await db.commit()


# ── Candidate helpers ───────────────────────────────────────

async def save_candidate(candidate_id: str, job_id: str, name: str, email: str | None,
                         resume_format: str, filename: str, parse_confidence: float,
                         profile_json: str, raw_text: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO candidates
               (candidate_id, job_id, name, email, resume_format, filename,
                parse_confidence, profile_json, raw_text, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (candidate_id, job_id, name, email, resume_format, filename,
             parse_confidence, profile_json, raw_text, datetime.utcnow().isoformat())
        )
        # Update resume count on job
        await db.execute(
            "UPDATE jobs SET resume_count = (SELECT COUNT(*) FROM candidates WHERE job_id = ?) WHERE job_id = ?",
            (job_id, job_id)
        )
        await db.commit()


async def get_candidate(candidate_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM candidates WHERE candidate_id = ?", (candidate_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def get_candidates_for_job(job_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at", (job_id,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_candidates_by_ids(candidate_ids: list[str]) -> list[dict]:
    if not candidate_ids:
        return []
    placeholders = ", ".join("?" for _ in candidate_ids)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(f"SELECT * FROM candidates WHERE candidate_id IN ({placeholders})", candidate_ids) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


# ── Match result helpers ────────────────────────────────────

async def save_match_result(candidate_id: str, job_id: str, compatibility_score: float, result_json: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO match_results
               (candidate_id, job_id, compatibility_score, result_json, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (candidate_id, job_id, compatibility_score, result_json, datetime.utcnow().isoformat())
        )
        await db.commit()


async def get_match_result(candidate_id: str, job_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM match_results WHERE candidate_id = ? AND job_id = ?",
            (candidate_id, job_id)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def get_rankings_for_job(job_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM match_results WHERE job_id = ? ORDER BY compatibility_score DESC",
            (job_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_hidden_gems_for_job(job_id: str) -> list[dict]:
    results = await get_rankings_for_job(job_id)
    gems = []
    for r in results:
        data = json.loads(r["result_json"])
        if data.get("hidden_gem_flag"):
            gems.append(r)
    return gems


# ── Batch status helpers ────────────────────────────────────

async def save_batch_item(job_id: str, filename: str, status: str = "queued"):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO batch_status (job_id, filename, status, created_at) VALUES (?, ?, ?, ?)",
            (job_id, filename, status, datetime.utcnow().isoformat())
        )
        await db.commit()


async def update_batch_item(job_id: str, filename: str, **kwargs):
    if not kwargs:
        return
    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [job_id, filename]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE batch_status SET {set_clause} WHERE job_id = ? AND filename = ?",
            values
        )
        await db.commit()


async def get_batch_status(job_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM batch_status WHERE job_id = ? ORDER BY created_at",
            (job_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


# ── Stats helpers ───────────────────────────────────────────

async def get_global_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        total_resumes = 0
        total_jobs = 0
        hidden_gems = 0

        async with db.execute("SELECT COUNT(*) FROM candidates") as c:
            total_resumes = (await c.fetchone())[0]

        async with db.execute("SELECT COUNT(*) FROM jobs") as c:
            total_jobs = (await c.fetchone())[0]

        async with db.execute("SELECT result_json FROM match_results") as c:
            rows = await c.fetchall()
            for row in rows:
                data = json.loads(row[0])
                if data.get("hidden_gem_flag"):
                    hidden_gems += 1

        return {
            "total_resumes": total_resumes,
            "total_jobs": total_jobs,
            "hidden_gems_count": hidden_gems,
            "avg_processing_time_ms": 0.0,
        }
