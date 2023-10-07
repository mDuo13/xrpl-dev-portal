#!/usr/bin/env python
import os, os.path
import re

JA_FILE = re.compile("^([a-z_-]+)\.ja\.md$")
TOP_DIR = "content/"
JA_DIR = "content/@i18n/ja/"

IGNORE_PATHS = [
    ".git",
    "node_modules",
    "@i18n",
]

def plan_moves(top_dir):
    """
    Returns a tuple of (src, dst) paths to markdown files within top_dir to be moved for internationalization.
    """
    moves = []
    for dirpath, dirnames, filenames in os.walk(top_dir):
        for ignore in IGNORE_PATHS:
            if ignore in dirnames:
                dirnames.remove(ignore)

        relpath = os.path.relpath(dirpath, start=TOP_DIR)
        for fname in filenames:
            m = JA_FILE.match(fname)
            if m:
                new_fname = m.group(1) + ".md"
                new_path = os.path.join(JA_DIR, relpath, new_fname)
                old_path = os.path.join(dirpath, fname)
                moves.append( (old_path, new_path) )

    return moves

def print_moves(moves):
    for old,new in moves:
        print("Old:", old)
        print("New:", new)

if __name__ == "__main__":
    print_moves(plan_moves(TOP_DIR))