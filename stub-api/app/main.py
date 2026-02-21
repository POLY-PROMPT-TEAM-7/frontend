from __future__ import annotations

import json
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="KG Study Tool Stub API", version="0.1.0")

DEMO_GRAPH_ID = "demo-biology"
DEMO_UPLOAD_ID = "demo-upload"
TRANSITION_SECONDS = 2.0

DEMO_GRAPH_PATH = Path(__file__).with_name("demo_graph.json")
DEMO_GRAPH = json.loads(DEMO_GRAPH_PATH.read_text(encoding="utf-8"))

_extract_started_at: dict[str, float] = {}


class ExtractRequest(BaseModel):
    upload_id: str


def _graph_exists(graph_id: str) -> bool:
    return graph_id == DEMO_GRAPH_ID


@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)) -> dict[str, object]:
    response_files = []
    for index, upload in enumerate(files):
        payload = await upload.read()
        response_files.append(
            {
                "id": f"file-{index + 1}",
                "name": upload.filename or f"upload-{index + 1}",
                "size": len(payload),
                "mime_type": upload.content_type or "application/octet-stream",
                "status": "accepted",
            }
        )

    return {
        "upload_id": DEMO_UPLOAD_ID,
        "files": response_files,
    }


@app.post("/extract")
def extract(request: ExtractRequest) -> dict[str, str]:
    _extract_started_at[DEMO_GRAPH_ID] = time.time()
    return {
        "graph_id": DEMO_GRAPH_ID,
        "status": "queued",
        "message": f"Queued extraction for upload {request.upload_id}",
    }


@app.get("/graph/{graph_id}")
def get_graph(graph_id: str):
    if not _graph_exists(graph_id):
        raise HTTPException(status_code=404, detail="graph_id not found")

    started_at = _extract_started_at.get(graph_id)
    if started_at is None:
        _extract_started_at[graph_id] = time.time()
        return JSONResponse(status_code=202, content={
            "status": "queued",
            "graph_id": graph_id,
            "message": "Extraction queued",
        })

    elapsed = time.time() - started_at
    if elapsed < TRANSITION_SECONDS:
        return JSONResponse(status_code=202, content={
            "status": "queued",
            "graph_id": graph_id,
            "message": "Extraction queued",
        })

    if elapsed < TRANSITION_SECONDS * 2:
        return JSONResponse(status_code=202, content={
            "status": "processing",
            "graph_id": graph_id,
            "message": "Extraction processing",
        })

    return DEMO_GRAPH


@app.get("/node/{graph_id}/{node_id}")
def get_node_details(graph_id: str, node_id: str) -> dict[str, object]:
    if not _graph_exists(graph_id):
        raise HTTPException(status_code=404, detail="graph_id not found")

    nodes = DEMO_GRAPH["nodes"]
    edges = DEMO_GRAPH["edges"]

    node = next((item for item in nodes if item["id"] == node_id), None)
    if node is None:
        raise HTTPException(status_code=404, detail="node_id not found")

    inbound = [edge for edge in edges if edge["target"] == node_id]
    outbound = [edge for edge in edges if edge["source"] == node_id]

    return {
        "node": node,
        "inbound": inbound,
        "outbound": outbound,
    }


@app.get("/search/{graph_id}")
def search(graph_id: str, q: str = Query(default="", min_length=0)) -> dict[str, object]:
    if not _graph_exists(graph_id):
        raise HTTPException(status_code=404, detail="graph_id not found")

    query = q.strip().lower()
    if query == "":
        results = []
    else:
        results = [
            {
                "id": node["id"],
                "name": node["name"],
                "entity_type": node["entity_type"],
                "description": node.get("description"),
            }
            for node in DEMO_GRAPH["nodes"]
            if query in node["name"].lower() or query in node.get("description", "").lower()
        ]

    return {
        "graph_id": graph_id,
        "query": q,
        "results": results,
    }
