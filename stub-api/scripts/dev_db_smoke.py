from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db import (  # noqa: E402
    connect,
    get_or_create_category,
    get_or_create_node,
    get_or_create_predicate,
    init_db,
    insert_edge,
    store_kg_blob,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    conn = connect(":memory:")
    assert_true(isinstance(conn, sqlite3.Connection), "connect() must return sqlite3.Connection")

    init_db(conn)

    tables = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }
    expected_tables = {
        "categories",
        "predicates",
        "nodes",
        "edges",
        "node_aliases",
        "kg_blob",
    }
    assert_true(expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}")

    indexes = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index'"
        ).fetchall()
    }
    expected_indexes = {
        "idx_nodes_category",
        "idx_edges_subject",
        "idx_edges_object",
        "idx_node_aliases_node",
    }
    assert_true(expected_indexes.issubset(indexes), f"Missing indexes: {expected_indexes - indexes}")

    cat_id = get_or_create_category(conn, "CONCEPT")
    assert_true(cat_id > 0, "Category ID should be positive")
    assert_true(get_or_create_category(conn, "CONCEPT") == cat_id, "Category must dedupe")

    pred_id = get_or_create_predicate(conn, "RELATED_TO")
    assert_true(pred_id > 0, "Predicate ID should be positive")
    assert_true(get_or_create_predicate(conn, "related_to") == pred_id, "Predicate should normalize uppercase")

    subject = {
        "id": "n1",
        "name": "Cell",
        "description": "Basic biological unit",
        "aliases": ["Biological cell", "cell"],
    }
    object_node = {
        "id": "n2",
        "name": "Nucleus",
        "description": "Membrane bound organelle",
        "aliases": ["Cell nucleus"],
    }
    s_id = get_or_create_node(conn, subject, "CONCEPT")
    o_id = get_or_create_node(conn, object_node, "CONCEPT")
    assert_true(s_id > 0 and o_id > 0, "Node IDs should be positive")

    alias_count = conn.execute(
        "SELECT COUNT(*) FROM node_aliases WHERE node_id = ?",
        (s_id,),
    ).fetchone()[0]
    assert_true(alias_count == 2, "Expected aliases to be inserted for subject node")

    rel = {
        "subject_id": "n1",
        "predicate": "part_of",
        "object_id": "n2",
        "evidence": "textbook",
    }
    edge_id = insert_edge(conn, rel)
    assert_true(edge_id > 0, "Edge ID should be positive")
    assert_true(insert_edge(conn, rel) == edge_id, "Edge insert should dedupe by unique triplet")

    kg_dict = {
        "nodes": [subject, object_node],
        "edges": [rel],
    }
    store_kg_blob(conn, kg_dict)
    blob_row = conn.execute(
        "SELECT payload_json FROM kg_blob ORDER BY blob_id DESC LIMIT 1"
    ).fetchone()
    assert_true(blob_row is not None and "\"nodes\"" in blob_row[0], "kg_blob should persist json payload")

    print("dev_db_smoke.py: PASS")


if __name__ == "__main__":
    main()
