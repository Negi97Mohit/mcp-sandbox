#!/usr/bin/env python3
"""
dijkstra.py - Implementation of Dijkstra's shortest path algorithm.

This module provides a simple, pure-Python implementation of Dijkstra's
algorithm for finding the shortest path from a source node to all other
nodes in a weighted graph with non‑negative edge weights.

The graph can be represented in several ways; the implementation below
expects the graph to be provided as a dictionary of adjacency lists:

    graph = {
        'A': {'B': 1, 'C': 4},
        'B': {'A': 1, 'C': 2, 'D': 5},
        'C': {'A': 4, 'B': 2, 'D': 1},
        'D': {'B': 5, 'C': 1}
    }

Nodes can be any hashable type (strings, integers, etc.). Edge weights
must be non‑negative numbers (int or float).

The main function `dijkstra(graph, source)` returns a tuple:

    (distances, predecessors)

- `distances` is a dict mapping each node to its shortest distance from
  the source.
- `predecessors` is a dict that can be used to reconstruct the actual
  path from the source to any target node.

Example
-------
>>> graph = {
...     'A': {'B': 1, 'C': 4},
...     'B': {'A': 1, 'C': 2, 'D': 5},
...     'C': {'A': 4, 'B': 2, 'D': 1},
...     'D': {'B': 5, 'C': 1}
... }
>>> distances, predecessors = dijkstra(graph, 'A')
>>> distances['D']
3
>>> predecessors['D']
'C'
>>> # Reconstruct path from 'A' to 'D'
>>> path = []
>>> cur = 'D'
>>> while cur is not None:
...     path.append(cur)
...     cur = predecessors[cur]
... path.reverse()
>>> path
['A', 'B', 'C', 'D']
"""

import heapq
from typing import Dict, Tuple, Hashable, Any


def dijkstra(
    graph: Dict[Hashable, Dict[Hashable, float]],
    source: Hashable,
) -> Tuple[Dict[Hashable, float], Dict[Hashable, Any]]:
    """
    Compute shortest paths from `source` to all other nodes in `graph`.

    Parameters
    ----------
    graph : dict
        Mapping from each node to a dict of neighbors and edge weights.
        The graph must be directed or undirected; for an undirected graph,
        each edge should appear in both adjacency lists.
    source : hashable
        The node from which distances are measured.

    Returns
    -------
    distances : dict
        Mapping from each reachable node to its shortest distance from
        `source`. Nodes that are unreachable will not appear in the
        dict.
    predecessors : dict
        Mapping from each reachable node to its predecessor on the
        shortest‑path tree. The predecessor of `source` is `None`.

    Notes
    -----
    - The algorithm runs in O(E log V) time using a binary heap (`heapq`).
    - Only non‑negative edge weights are supported. Negative weights require
      the Bellman‑Ford algorithm.
    """
    # Distance to every node is initially infinity, except the source (0).
    distances: Dict[Hashable, float] = {source: 0.0}
    # To track the path, store the predecessor of each node.
    predecessors: Dict[Hashable, Any] = {source: None}

    # Priority queue entries are (distance, node).
    # We use a list and `heapq` to always pop the smallest distance.
    priority_queue: list[Tuple[float, Hashable]] = [(0.0, source)]

    while priority_queue:
        current_dist, current_node = heapq.heappop(priority_queue)

        # If we have already found a better way, skip processing this entry.
        if current_dist > distances.get(current_node, float('inf')):
            continue

        # Explore neighbors.
        for neighbor, weight in graph.get(current_node, {}).items():
            if weight < 0:
                raise ValueError("Dijkstra's algorithm does not support negative weights.")
            new_dist = current_dist + weight
            # If this new distance is shorter, record it and push to heap.
            if new_dist < distances.get(neighbor, float('inf')):
                distances[neighbor] = new_dist
                predecessors[neighbor] = current_node
                heapq.heappush(priority_queue, (new_dist, neighbor))

    return distances, predecessors


def reconstruct_path(
    predecessors: Dict[Hashable, Any], target: Hashable
) -> list[Hashable]:
    """
    Reconstruct the shortest path from the source to `target` using the
    `predecessors` dictionary returned by `dijkstra`.

    Parameters
    ----------
    predecessors : dict
        The predecessor mapping from `dijkstra`.
    target : hashable
        The destination node.

    Returns
    -------
    path : list
        List of nodes from the source to `target` (inclusive). If `target`
        is unreachable, an empty list is returned.
    """
    if target not in predecessors:
        return []  # Unreachable

    path = []
    cur = target
    while cur is not None:
        path.append(cur)
        cur = predecessors[cur]
    path.reverse()
    return path


if __name__ == "__main__":
    # Simple demo when the file is executed directly.
    example_graph = {
        'A': {'B': 1, 'C': 4},
        'B': {'A': 1, 'C': 2, 'D': 5},
        'C': {'A': 4, 'B': 2, 'D': 1},
        'D': {'B': 5, 'C': 1}
    }

    src = 'A'
    dists, preds = dijkstra(example_graph, src)

    print(f"Shortest distances from {src}:")
    for node, d in dists.items():
        print(f"  {node}: {d}")

    target_node = 'D'
    path = reconstruct_path(preds, target_node)
    print(f"\nShortest path from {src} to {target_node}: {' -> '.join(path)}")