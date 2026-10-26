import json
import logging
import os
import random
import re
import sqlite3
from pathlib import Path

logger = logging.getLogger("brainrot.dataset")

class BrainrotDataset:
    def __init__(self, data_path: str | Path | None = None):
        if data_path is None:
            # Look in parent root or current directory
            possible_paths = [
                Path(__file__).parent.parent / "data.txt",
                Path(__file__).parent / "data.txt",
                Path("data.txt"),
                Path("../data.txt"),
            ]
            for p in possible_paths:
                if p.is_file():
                    data_path = p
                    break
        self.data_path = Path(data_path) if data_path else None
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.total_examples = 0
        self._init_db()

    def _init_db(self):
        self.fts_enabled = True
        try:
            self.conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS conversations USING fts5(
                    id UNINDEXED,
                    query,
                    dialogue
                )
            """)
        except sqlite3.OperationalError as exc:
            # Some serverless Python builds ship SQLite without FTS5.
            # Fall back to a plain table and random example selection.
            logger.warning(f"SQLite FTS5 unavailable ({exc}); using random example selection.")
            self.fts_enabled = False
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations(
                    id INTEGER,
                    query TEXT,
                    dialogue TEXT
                )
            """)
        if not self.data_path or not self.data_path.is_file():
            logger.warning(f"data.txt not found at {self.data_path}, dataset will be empty.")
            return

        rows = []
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                for idx, line in enumerate(f):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        item = json.loads(line)
                        msgs = item.get("messages", [])
                        user_parts = []
                        dialogue_lines = []
                        for m in msgs:
                            role = m.get("role")
                            content = m.get("content", "").strip()
                            if role == "user":
                                user_parts.append(content)
                                dialogue_lines.append(f"User: {content}")
                            elif role == "assistant":
                                dialogue_lines.append(f"Brainrot AI: {content}")
                        if user_parts and dialogue_lines:
                            query_text = " ".join(user_parts)
                            dialogue_text = "\n".join(dialogue_lines)
                            rows.append((idx, query_text, dialogue_text))
                    except Exception:
                        continue
            self.conn.executemany("INSERT INTO conversations(id, query, dialogue) VALUES (?, ?, ?)", rows)
            self.conn.commit()
            self.total_examples = len(rows)
            logger.info(f"Loaded {self.total_examples} brainrot conversations from {self.data_path}")
        except Exception as e:
            logger.error(f"Error loading data.txt: {e}")

    def clean_query(self, text: str) -> str:
        words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", text.lower())
        stopwords = {
            "the", "and", "for", "with", "that", "this", "what", "how", "why",
            "are", "you", "can", "about", "have", "from", "just", "like", "will"
        }
        filtered = [w for w in words if w not in stopwords]
        return " OR ".join(filtered) if filtered else ""

    def get_relevant_examples(self, user_query: str, limit: int = 2) -> list[str]:
        if self.total_examples == 0:
            return []

        cleaned = self.clean_query(user_query)
        if self.fts_enabled and cleaned:
            try:
                cursor = self.conn.execute(
                    "SELECT DISTINCT dialogue FROM conversations WHERE conversations MATCH ? ORDER BY rank LIMIT ?",
                    (cleaned, limit)
                )
                results = [r[0] for r in cursor.fetchall()]
                if results:
                    return results
            except Exception:
                pass

        sample_limit = min(limit, self.total_examples)
        cursor = self.conn.execute(
            "SELECT DISTINCT dialogue FROM conversations ORDER BY RANDOM() LIMIT ?",
            (sample_limit,)
        )
        return [r[0] for r in cursor.fetchall()]

    def format_few_shot_prompt(self, examples: list[str]) -> str:
        if not examples:
            return ""
        formatted = "\n\n".join(f"Example {i+1}:\n{ex}" for i, ex in enumerate(examples))
        return (
            "CADENCE REFERENCE (low-quality slang archive — borrow the short, chaotic rhythm only. "
            "Do NOT copy the lines, repeat slang, or produce gibberish. Your answer must still be useful and coherent):\n"
            + formatted
        )

# Global singleton
brainrot_dataset = BrainrotDataset()
