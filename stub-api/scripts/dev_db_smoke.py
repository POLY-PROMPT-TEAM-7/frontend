from __future__ import annotations

import json
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


def table_columns(conn: sqlite3.Connection, table_name: str) -> list[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return [str(row[1]) for row in rows]


def main() -> None:
    conn = connect(":memory:")
    assert_true(isinstance(conn, sqlite3.Connection), "connect() must return sqlite3.Connection")

    fk_status = conn.execute("PRAGMA foreign_keys").fetchone()
    assert_true(fk_status is not None and fk_status[0] == 1, "connect() must enable foreign_keys")

    init_db(conn)

    assert_true(table_columns(conn, "categories") == ["category_id", "category_name"], "categories schema mismatch")
    assert_true(table_columns(conn, "predicates") == ["predicate_id", "predicate_name"], "predicates schema mismatch")
    assert_true(
        table_columns(conn, "nodes")
        == ["node_id", "node_iri", "node_name", "category_id", "node_json"],
        "nodes schema mismatch",
    )
    assert_true(
        table_columns(conn, "edges")
        == ["edge_id", "subject_node_id", "object_node_id", "predicate_id", "edge_json"],
        "edges schema mismatch",
    )
    assert_true(table_columns(conn, "node_aliases") == ["node_id", "alias"], "node_aliases schema mismatch")
    assert_true(table_columns(conn, "kg_blob") == ["id", "kg_json", "updated_at"], "kg_blob schema mismatch")

    indexes = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index'"
        ).fetchall()
    }
    expected_indexes = {
        "idx_nodes_category",
        "idx_nodes_name",
        "idx_edges_subject",
        "idx_edges_object",
        "idx_edges_predicate",
        "idx_node_aliases_alias",
    }
    assert_true(expected_indexes.issubset(indexes), f"Missing indexes: {expected_indexes - indexes}")

    cat_id = get_or_create_category(conn, " Concept ")
    assert_true(cat_id > 0, "Category ID should be positive")
    assert_true(get_or_create_category(conn, "Concept") == cat_id, "Category should trim but not uppercase")
    stored_category = conn.execute(
        "SELECT category_name FROM categories WHERE category_id = ?",
        (cat_id,),
    ).fetchone()
    assert_true(stored_category is not None and stored_category[0] == "Concept", "Category should store trimmed name")

    pred_id = get_or_create_predicate(conn, "related_to")
    assert_true(pred_id > 0, "Predicate ID should be positive")
    assert_true(get_or_create_predicate(conn, "related_to") == pred_id, "Predicate should normalize uppercase")
    stored_predicate = conn.execute(
        "SELECT predicate_name FROM predicates WHERE predicate_id = ?",
        (pred_id,),
    ).fetchone()
    assert_true(stored_predicate is not None and stored_predicate[0] == "RELATED_TO", "Predicate should store uppercase")

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

    node_row = conn.execute(
        "SELECT node_iri, node_name, node_json FROM nodes WHERE node_id = ?",
        (s_id,),
    ).fetchone()
    assert_true(node_row is not None and node_row[0] == "n1" and node_row[1] == "Cell", "Node mapping should use id->node_iri")
    assert_true(node_row is not None and json.loads(node_row[2])["description"] == subject["description"], "node_json should store full entity")

    alias_count = conn.execute(
        "SELECT COUNT(*) FROM node_aliases WHERE node_id = ?",
        (s_id,),
    ).fetchone()[0]
    assert_true(alias_count == 2, "Expected aliases to be inserted for subject node")

    rel = {
        "subject": "n1",
        "predicate": "part_of",
        "object": "n2",
        "source": "textbook",
    }
    edge_id = insert_edge(conn, rel)
    assert_true(edge_id > 0, "Edge ID should be positive")
    assert_true(insert_edge(conn, rel) == edge_id, "Edge insert should dedupe by unique triplet")
    edge_json = conn.execute(
        "SELECT edge_json FROM edges WHERE edge_id = ?",
        (edge_id,),
    ).fetchone()
    assert_true(edge_json is not None and json.loads(edge_json[0])["predicate"] == "part_of", "edge_json should store full rel")

    kg_dict = {
        "nodes": [subject, object_node],
        "edges": [rel],
    }
    store_kg_blob(conn, kg_dict)
    store_kg_blob(conn, {"nodes": [subject], "edges": []})
    blob_row = conn.execute(
        "SELECT id, kg_json FROM kg_blob"
    ).fetchone()
    blob_count = conn.execute("SELECT COUNT(*) FROM kg_blob").fetchone()[0]
    assert_true(blob_count == 1, "kg_blob should keep exactly one row")
    assert_true(blob_row is not None and blob_row[0] == 1 and "\"nodes\"" in blob_row[1], "kg_blob should upsert id=1")

    print("dev_db_smoke.py: PASS")


if __name__ == "__main__":
    main()
