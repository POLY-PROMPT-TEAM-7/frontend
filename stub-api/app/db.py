from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from typing import Any


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS predicates (
            predicate_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS nodes (
            node_id INTEGER PRIMARY KEY,
            external_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            category_id INTEGER NOT NULL,
            raw_json TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        );

        CREATE TABLE IF NOT EXISTS edges (
            edge_id INTEGER PRIMARY KEY,
            subject_node_id INTEGER NOT NULL,
            predicate_id INTEGER NOT NULL,
            object_node_id INTEGER NOT NULL,
            evidence TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (subject_node_id) REFERENCES nodes(node_id),
            FOREIGN KEY (predicate_id) REFERENCES predicates(predicate_id),
            FOREIGN KEY (object_node_id) REFERENCES nodes(node_id),
            UNIQUE(subject_node_id, predicate_id, object_node_id)
        );

        CREATE TABLE IF NOT EXISTS node_aliases (
            alias_id INTEGER PRIMARY KEY,
            node_id INTEGER NOT NULL,
            alias TEXT NOT NULL,
            FOREIGN KEY (node_id) REFERENCES nodes(node_id),
            UNIQUE(node_id, alias)
        );

        CREATE TABLE IF NOT EXISTS kg_blob (
            blob_id INTEGER PRIMARY KEY,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_category ON nodes(category_id);
        CREATE INDEX IF NOT EXISTS idx_edges_subject ON edges(subject_node_id);
        CREATE INDEX IF NOT EXISTS idx_edges_object ON edges(object_node_id);
        CREATE INDEX IF NOT EXISTS idx_node_aliases_node ON node_aliases(node_id);
        """
    )
    conn.commit()


def get_or_create_category(conn: sqlite3.Connection, name: str) -> int:
    normalized = name.strip()
    conn.execute(
        "INSERT INTO categories(name) VALUES (?) ON CONFLICT(name) DO NOTHING",
        (normalized,),
    )
    row = conn.execute(
        "SELECT category_id FROM categories WHERE name = ?",
        (normalized,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve category: {name}")
    conn.commit()
    return int(row[0])


def get_or_create_predicate(conn: sqlite3.Connection, name: str) -> int:
    normalized = name.strip().upper()
    conn.execute(
        "INSERT INTO predicates(name) VALUES (?) ON CONFLICT(name) DO NOTHING",
        (normalized,),
    )
    row = conn.execute(
        "SELECT predicate_id FROM predicates WHERE name = ?",
        (normalized,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve predicate: {name}")
    conn.commit()
    return int(row[0])


def get_or_create_node(conn: sqlite3.Connection, entity_dict: dict[str, Any], category_name: str) -> int:
    external_id = str(entity_dict.get("id", "")).strip()
    if external_id == "":
        raise ValueError("entity_dict.id is required")

    category_id = get_or_create_category(conn, category_name)
    node_name = str(entity_dict.get("name", external_id)).strip() or external_id
    description = entity_dict.get("description")
    raw_json = json.dumps(entity_dict, sort_keys=True, ensure_ascii=True)

    conn.execute(
        (
            "INSERT INTO nodes(external_id, name, description, category_id, raw_json) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(external_id) DO NOTHING"
        ),
        (external_id, node_name, description, category_id, raw_json),
    )
    row = conn.execute(
        "SELECT node_id FROM nodes WHERE external_id = ?",
        (external_id,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve node: {external_id}")
    node_id = int(row[0])

    aliases = entity_dict.get("aliases")
    if isinstance(aliases, list):
        for alias in aliases:
            alias_text = str(alias).strip()
            if alias_text == "":
                continue
            conn.execute(
                "INSERT INTO node_aliases(node_id, alias) VALUES (?, ?) ON CONFLICT(node_id, alias) DO NOTHING",
                (node_id, alias_text),
            )

    conn.commit()
    return node_id


def insert_edge(conn: sqlite3.Connection, rel_dict: dict[str, Any]) -> int:
    subject_external_id = str(rel_dict.get("subject_id", "")).strip()
    object_external_id = str(rel_dict.get("object_id", "")).strip()
    predicate_name = str(rel_dict.get("predicate", "")).strip()

    if subject_external_id == "" or object_external_id == "" or predicate_name == "":
        raise ValueError("rel_dict requires subject_id, object_id, predicate")

    subject_row = conn.execute(
        "SELECT node_id FROM nodes WHERE external_id = ?",
        (subject_external_id,),
    ).fetchone()
    object_row = conn.execute(
        "SELECT node_id FROM nodes WHERE external_id = ?",
        (object_external_id,),
    ).fetchone()
    if subject_row is None or object_row is None:
        raise ValueError("Edge references unknown subject_id or object_id")

    predicate_id = get_or_create_predicate(conn, predicate_name)
    timestamp = datetime.now(UTC).isoformat()

    conn.execute(
        (
            "INSERT INTO edges(subject_node_id, predicate_id, object_node_id, evidence, created_at) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(subject_node_id, predicate_id, object_node_id) DO NOTHING"
        ),
        (int(subject_row[0]), predicate_id, int(object_row[0]), rel_dict.get("evidence"), timestamp),
    )
    row = conn.execute(
        (
            "SELECT edge_id FROM edges WHERE subject_node_id = ? AND predicate_id = ? AND object_node_id = ?"
        ),
        (int(subject_row[0]), predicate_id, int(object_row[0])),
    ).fetchone()
    if row is None:
        raise ValueError("Unable to resolve edge id after insert")
    conn.commit()
    return int(row[0])


def store_kg_blob(conn: sqlite3.Connection, kg_dict: dict[str, Any]) -> None:
    payload = json.dumps(kg_dict, sort_keys=True, ensure_ascii=True)
    timestamp = datetime.now(UTC).isoformat()
    conn.execute(
        "INSERT INTO kg_blob(payload_json, created_at) VALUES (?, ?)",
        (payload, timestamp),
    )
    conn.commit()
