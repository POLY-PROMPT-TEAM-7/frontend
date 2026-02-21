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
            category_name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS predicates (
            predicate_id INTEGER PRIMARY KEY,
            predicate_name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS nodes (
            node_id INTEGER PRIMARY KEY,
            node_iri TEXT UNIQUE NOT NULL,
            node_name TEXT NOT NULL,
            category_id INTEGER,
            node_json TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        );

        CREATE TABLE IF NOT EXISTS edges (
            edge_id INTEGER PRIMARY KEY,
            subject_node_id INTEGER NOT NULL,
            object_node_id INTEGER NOT NULL,
            predicate_id INTEGER NOT NULL,
            edge_json TEXT NOT NULL,
            FOREIGN KEY (subject_node_id) REFERENCES nodes(node_id),
            FOREIGN KEY (object_node_id) REFERENCES nodes(node_id),
            FOREIGN KEY (predicate_id) REFERENCES predicates(predicate_id),
            UNIQUE(subject_node_id, predicate_id, object_node_id)
        );

        CREATE TABLE IF NOT EXISTS node_aliases (
            node_id INTEGER NOT NULL,
            alias TEXT NOT NULL,
            FOREIGN KEY (node_id) REFERENCES nodes(node_id),
            UNIQUE(node_id, alias)
        );

        CREATE TABLE IF NOT EXISTS kg_blob (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            kg_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_category ON nodes(category_id);
        CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(node_name);
        CREATE INDEX IF NOT EXISTS idx_edges_subject ON edges(subject_node_id);
        CREATE INDEX IF NOT EXISTS idx_edges_object ON edges(object_node_id);
        CREATE INDEX IF NOT EXISTS idx_edges_predicate ON edges(predicate_id);
        CREATE INDEX IF NOT EXISTS idx_node_aliases_alias ON node_aliases(alias);
        """
    )
    conn.commit()


def get_or_create_category(conn: sqlite3.Connection, category_name: str) -> int:
    normalized = category_name.strip()
    if normalized == "":
        raise ValueError("category_name is required")

    conn.execute(
        "INSERT INTO categories(category_name) VALUES (?) ON CONFLICT(category_name) DO NOTHING",
        (normalized,),
    )
    row = conn.execute(
        "SELECT category_id FROM categories WHERE category_name = ?",
        (normalized,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve category: {category_name}")
    conn.commit()
    return int(row[0])


def get_or_create_predicate(conn: sqlite3.Connection, predicate_name: str) -> int:
    normalized = predicate_name.strip().upper()
    if normalized == "":
        raise ValueError("predicate_name is required")

    conn.execute(
        "INSERT INTO predicates(predicate_name) VALUES (?) ON CONFLICT(predicate_name) DO NOTHING",
        (normalized,),
    )
    row = conn.execute(
        "SELECT predicate_id FROM predicates WHERE predicate_name = ?",
        (normalized,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve predicate: {predicate_name}")
    conn.commit()
    return int(row[0])


def get_or_create_node(conn: sqlite3.Connection, entity_dict: dict[str, Any], category_name: str) -> int:
    node_iri = str(entity_dict.get("id", "")).strip()
    if node_iri == "":
        raise ValueError("entity_dict.id is required")

    category_id = get_or_create_category(conn, category_name)
    node_name = str(entity_dict.get("name", node_iri)).strip() or node_iri
    node_json = json.dumps(entity_dict, sort_keys=True, ensure_ascii=True)

    conn.execute(
        (
            "INSERT INTO nodes(node_iri, node_name, category_id, node_json) "
            "VALUES (?, ?, ?, ?) "
            "ON CONFLICT(node_iri) DO NOTHING"
        ),
        (node_iri, node_name, category_id, node_json),
    )
    row = conn.execute(
        "SELECT node_id FROM nodes WHERE node_iri = ?",
        (node_iri,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Unable to resolve node: {node_iri}")
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
    subject_node_iri = str(rel_dict.get("subject", "")).strip()
    object_node_iri = str(rel_dict.get("object", "")).strip()
    predicate_name = str(rel_dict.get("predicate", "")).strip()

    if subject_node_iri == "" or object_node_iri == "" or predicate_name == "":
        raise ValueError("rel_dict requires subject, object, predicate")

    subject_row = conn.execute(
        "SELECT node_id FROM nodes WHERE node_iri = ?",
        (subject_node_iri,),
    ).fetchone()
    object_row = conn.execute(
        "SELECT node_id FROM nodes WHERE node_iri = ?",
        (object_node_iri,),
    ).fetchone()
    if subject_row is None or object_row is None:
        raise ValueError("Edge references unknown subject or object")

    predicate_id = get_or_create_predicate(conn, predicate_name)
    edge_json = json.dumps(rel_dict, sort_keys=True, ensure_ascii=True)

    conn.execute(
        (
            "INSERT INTO edges(subject_node_id, object_node_id, predicate_id, edge_json) "
            "VALUES (?, ?, ?, ?) "
            "ON CONFLICT(subject_node_id, predicate_id, object_node_id) DO NOTHING"
        ),
        (int(subject_row[0]), int(object_row[0]), predicate_id, edge_json),
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
        "INSERT OR REPLACE INTO kg_blob(id, kg_json, updated_at) VALUES (1, ?, ?)",
        (payload, timestamp),
    )
    conn.commit()
